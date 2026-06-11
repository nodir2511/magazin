import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 2_000_000) {
    return json({ error: "Payload is too large" }, 413);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") || "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase function environment is not configured" }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();

  if (authError || !authData.user) {
    return json({ error: "Authentication required" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .single();

  if (roleError || !["admin", "manager"].includes(roleRow?.role)) {
    return json({ error: "Role is not allowed to save store data" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const incoming = normalizeDb(body.data);
  const action = cleanText(body.action || "Изменение", 120);
  const details = cleanText(body.details || "", 500);

  // Слияние с защитой от гонки: читаем текущее состояние, сливаем, пишем
  // с проверкой updated_at. Если кто-то записал параллельно — повторяем.
  let merged = incoming;
  let saved = false;
  let lastError = "";

  for (let attempt = 0; attempt < 6 && !saved; attempt++) {
    const { data: existingRow, error: readError } = await adminClient
      .from("store_state")
      .select("data, updated_at")
      .eq("id", "main")
      .maybeSingle();

    if (readError) {
      lastError = readError.message;
      break;
    }

    const newStamp = new Date().toISOString();

    if (existingRow) {
      merged = mergeStore(normalizeDb(existingRow.data), incoming);
      const { data: updatedRows, error: updateError } = await adminClient
        .from("store_state")
        .update({ data: merged, updated_at: newStamp })
        .eq("id", "main")
        .eq("updated_at", existingRow.updated_at)
        .select("updated_at");

      if (updateError) {
        lastError = updateError.message;
      } else if (updatedRows && updatedRows.length) {
        saved = true;
      }
      // updatedRows пуст → параллельная запись, пробуем снова
    } else {
      merged = incoming;
      const { error: insertError } = await adminClient
        .from("store_state")
        .insert({ id: "main", data: merged, updated_at: newStamp });

      if (!insertError) {
        saved = true;
      } else {
        lastError = insertError.message;
        // строка могла появиться параллельно → следующая итерация обновит её
      }
    }
  }

  if (!saved) {
    return json({ error: lastError || "Не удалось сохранить (конфликт записи)" }, 409);
  }

  const { data: finalRow } = await adminClient
    .from("store_state")
    .select("data, updated_at")
    .eq("id", "main")
    .maybeSingle();

  const { error: changeError } = await adminClient
    .from("store_changes")
    .insert({
      user_id: authData.user.id,
      user_email: authData.user.email || "unknown",
      action,
      details,
    });

  if (changeError) {
    return json({ error: changeError.message }, 400);
  }

  return json({
    ok: true,
    data: finalRow ? finalRow.data : merged,
    updated_at: finalRow ? finalRow.updated_at : null,
  }, 200);
});

const COLLECTIONS = ["products", "arrivals", "sales", "returns", "expenses", "writeoffs"] as const;
const TOMBSTONE_LIMIT = 1000;

function collectionKey(name: string) {
  return name === "products" ? "sku" : "id";
}

// Слияние двух баз: побеждает запись с большим updatedAt; удалённые исключаются.
function mergeStore(base: Record<string, any>, incoming: Record<string, any>) {
  const result: Record<string, any> = { deleted: emptyDeleted() };

  for (const name of COLLECTIONS) {
    const key = collectionKey(name);
    const deletedSet = new Set([
      ...(base.deleted?.[name] || []),
      ...(incoming.deleted?.[name] || []),
    ]);

    const map = new Map<unknown, any>();
    for (const item of [...(base[name] || []), ...(incoming[name] || [])]) {
      const id = item[key];
      const prev = map.get(id);
      if (!prev || (item.updatedAt || 0) >= (prev.updatedAt || 0)) map.set(id, item);
    }

    result[name] = [...map.values()].filter((item) => !deletedSet.has(item[key]));
    result.deleted[name] = Array.from(deletedSet).slice(-TOMBSTONE_LIMIT);
  }

  return result;
}

function emptyDeleted() {
  return { products: [], arrivals: [], sales: [], returns: [], expenses: [], writeoffs: [] };
}

function normalizeDb(value: unknown) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const products = Array.isArray(data.products)
    ? data.products.map((item) => {
      const product = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        sku: cleanText(product.sku, 80),
        name: cleanText(product.name, 160),
        category: cleanText(product.category, 120),
        photo: isPhotoPath(product.photo) ? product.photo : "",
        salePrice: cleanNumber(product.salePrice),
        ignoreLowStock: Boolean(product.ignoreLowStock),
        updatedAt: cleanNumber(product.updatedAt),
      };
    })
    : [];

  return {
    products,
    arrivals: Array.isArray(data.arrivals)
      ? data.arrivals.map((item) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: cleanNumber(row.id),
          date: cleanText(row.date, 40),
          dateKey: cleanText(row.dateKey, 10),
          sku: cleanText(row.sku, 80),
          qty: cleanNumber(row.qty),
          buyPrice: cleanNumber(row.buyPrice),
          supplier: cleanText(row.supplier, 120),
          paid: row.paid !== false,
          updatedAt: cleanNumber(row.updatedAt),
        };
      })
      : [],
    sales: Array.isArray(data.sales)
      ? data.sales.map((item) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: cleanNumber(row.id),
          date: cleanText(row.date, 40),
          dateKey: cleanText(row.dateKey, 10),
          sku: cleanText(row.sku, 80),
          qty: cleanNumber(row.qty),
          sellPrice: cleanNumber(row.sellPrice),
          payment: cleanText(row.payment, 40),
          costPrice: cleanNumber(row.costPrice),
          updatedAt: cleanNumber(row.updatedAt),
        };
      })
      : [],
    returns: Array.isArray(data.returns)
      ? data.returns.map((item) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: cleanNumber(row.id),
          date: cleanText(row.date, 40),
          dateKey: cleanText(row.dateKey, 10),
          sku: cleanText(row.sku, 80),
          qty: cleanNumber(row.qty),
          refundAmount: cleanNumber(row.refundAmount),
          costPrice: cleanNumber(row.costPrice),
          updatedAt: cleanNumber(row.updatedAt),
        };
      })
      : [],
    expenses: Array.isArray(data.expenses)
      ? data.expenses.map((item) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: cleanNumber(row.id),
          date: cleanText(row.date, 40),
          dateKey: cleanText(row.dateKey, 10),
          category: cleanText(row.category, 120),
          amount: cleanNumber(row.amount),
          comment: cleanText(row.comment, 300),
          updatedAt: cleanNumber(row.updatedAt),
        };
      })
      : [],
    writeoffs: Array.isArray(data.writeoffs)
      ? data.writeoffs.map((item) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: cleanNumber(row.id),
          date: cleanText(row.date, 40),
          dateKey: cleanText(row.dateKey, 10),
          sku: cleanText(row.sku, 80),
          qty: cleanNumber(row.qty),
          reason: cleanText(row.reason, 120),
          costPrice: cleanNumber(row.costPrice),
          updatedAt: cleanNumber(row.updatedAt),
        };
      })
      : [],
    deleted: normalizeDeleted(data.deleted),
  };
}

function normalizeDeleted(value: unknown) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const result = emptyDeleted() as Record<string, unknown[]>;
  for (const name of COLLECTIONS) {
    const list = Array.isArray(data[name]) ? data[name] as unknown[] : [];
    const cleaned = list
      .map((v) => name === "products" ? cleanText(v, 80) : cleanNumber(v))
      .filter((v) => name === "products" ? v : Number.isFinite(v as number) && (v as number) > 0);
    result[name] = Array.from(new Set(cleaned)).slice(-TOMBSTONE_LIMIT);
  }
  return result;
}

function isPhotoPath(value: unknown) {
  return /^[a-zA-Z0-9/_-]+\.webp$/.test(String(value || ""));
}

function cleanText(value: unknown, limit: number) {
  return String(value || "").slice(0, limit);
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
