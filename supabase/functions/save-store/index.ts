import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS: разрешаем только свои источники. По умолчанию — домены *.vercel.app
// (прод + preview-деплои) и localhost. Чтобы ограничить точным доменом, задайте
// секрет функции ALLOWED_ORIGINS (значения через запятую) — тогда разрешён только он.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

function allowedOrigin(origin: string): string | null {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.length) return ALLOWED_ORIGINS.includes(origin) ? origin : null;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".vercel.app") || host === "localhost" || host === "127.0.0.1") return origin;
  } catch { /* invalid origin */ }
  return null;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = allowedOrigin(req.headers.get("Origin") || "");
  return {
    "Access-Control-Allow-Origin": origin || "null",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const cors = corsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
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

  // Менеджеру разрешено только ДОБАВЛЯТЬ новые записи. Редактирование и
  // удаление существующих (включая удаление товаров и списания) — только
  // для админа. Правило применяется на сервере, а не в интерфейсе.
  const isAdmin = roleRow?.role === "admin";

  // Лимит по РЕАЛЬНЫМ байтам тела: content-length клиент может не прислать
  // (chunked) или подделать, поэтому считаем сами и обрываем чтение.
  const parsed = await readJsonCapped(req, 2_000_000);
  if (parsed === "TOO_LARGE") {
    return json({ error: "Payload is too large" }, 413);
  }
  const body = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const incoming = normalizeDb(body.data);

  // Слияние с защитой от гонки: читаем текущее состояние, сливаем, пишем
  // с проверкой updated_at. Если кто-то записал параллельно — повторяем.
  let merged = incoming;
  let baseState = normalizeDb({}); // состояние ДО записи — для журнала изменений
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
      const base = normalizeDb(existingRow.data);
      merged = mergeStore(base, incoming, isAdmin);
      const { data: updatedRows, error: updateError } = await adminClient
        .from("store_state")
        .update({ data: merged, updated_at: newStamp })
        .eq("id", "main")
        .eq("updated_at", existingRow.updated_at)
        .select("updated_at");

      if (updateError) {
        lastError = updateError.message;
      } else if (updatedRows && updatedRows.length) {
        baseState = base;
        saved = true;
      }
      // updatedRows пуст → параллельная запись, пробуем снова
    } else {
      const base = normalizeDb({});
      merged = mergeStore(base, incoming, isAdmin);
      const { error: insertError } = await adminClient
        .from("store_state")
        .insert({ id: "main", data: merged, updated_at: newStamp });

      if (!insertError) {
        baseState = base;
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

  // Удаляем осиротевшие фото: были у товара в base, но в новом состоянии
  // больше не используются (товар удалён или фото заменено). service_role
  // обходит RLS, поэтому отдельная DELETE-политика не нужна.
  const usedPhotos = new Set(
    (merged.products || [])
      .map((p: Record<string, any>) => p.photo)
      .filter((ph: string) => ph),
  );
  const orphanPhotos = [
    ...new Set(
      (baseState.products || [])
        .map((p: Record<string, any>) => p.photo)
        .filter((ph: string) => ph && !usedPhotos.has(ph)),
    ),
  ] as string[];
  if (orphanPhotos.length) {
    try {
      await adminClient.storage.from("product-photos").remove(orphanPhotos);
    } catch (_) {
      // не критично — фото подчистятся при следующей записи
    }
  }

  // Журнал формируется из РЕАЛЬНО применённой разницы (на сервере), а не из
  // текста, присланного клиентом, — подделать описание изменения нельзя.
  const change = describeChange(baseState, merged);
  if (change) {
    const { error: changeError } = await adminClient
      .from("store_changes")
      .insert({
        user_id: authData.user.id,
        user_email: authData.user.email || "unknown",
        action: change.action,
        details: change.details,
      });

    if (changeError) {
      return json({ error: changeError.message }, 400);
    }
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

// Слияние двух баз.
// admin:   побеждает запись с большим updatedAt; учитываются удаления (tombstones).
// manager: база — источник истины; разрешено лишь ДОБАВИТЬ записи с новыми
//          ключами. Правки существующих и новые удаления игнорируются.
function mergeStore(
  base: Record<string, any>,
  incoming: Record<string, any>,
  isAdmin: boolean,
) {
  const result: Record<string, any> = { deleted: emptyDeleted() };

  for (const name of COLLECTIONS) {
    const key = collectionKey(name);

    // Новые tombstones принимаем только от админа.
    const deletedSet = new Set([
      ...(base.deleted?.[name] || []),
      ...(isAdmin ? (incoming.deleted?.[name] || []) : []),
    ]);

    const map = new Map<unknown, any>();

    if (isAdmin) {
      for (const item of [...(base[name] || []), ...(incoming[name] || [])]) {
        const id = item[key];
        const prev = map.get(id);
        if (!prev || (item.updatedAt || 0) >= (prev.updatedAt || 0)) map.set(id, item);
      }
    } else {
      // Существующие записи остаются как в базе (правки менеджера игнорируем).
      for (const item of base[name] || []) map.set(item[key], item);
      // Добавляем только записи с новыми ключами, которых нет и которые не удалены.
      for (const item of incoming[name] || []) {
        const id = item[key];
        if (!map.has(id) && !deletedSet.has(id)) map.set(id, item);
      }
    }

    result[name] = [...map.values()].filter((item) => !deletedSet.has(item[key]));
    result.deleted[name] = Array.from(deletedSet).slice(-TOMBSTONE_LIMIT);
  }

  return result;
}

const COLLECTION_LABELS: Record<string, string> = {
  products: "товары",
  arrivals: "приход",
  sales: "продажи",
  returns: "возвраты",
  expenses: "расходы",
  writeoffs: "списания",
};

function indexByKey(list: any[], key: string) {
  const map = new Map<unknown, any>();
  for (const item of list || []) map.set(item[key], item);
  return map;
}

// Достоверное описание изменения: сравниваем состояние ДО и ПОСЛЕ записи.
// Возвращает null, если ничего не изменилось (тогда в журнал не пишем).
function describeChange(before: Record<string, any>, after: Record<string, any>) {
  const nameBySku = new Map<unknown, string>(
    (after.products || []).map((p: any) => [p.sku, p.name || p.sku] as [unknown, string]),
  );
  const labelOf = (name: string, item: any) => {
    if (name === "products") return item.name || item.sku || "—";
    if (name === "expenses") return item.category || "—";
    return nameBySku.get(item.sku) || item.sku || "—";
  };

  const parts: string[] = [];
  let added = 0;
  let updated = 0;
  let removed = 0;

  for (const name of COLLECTIONS) {
    const key = collectionKey(name);
    const beforeMap = indexByKey(before[name], key);
    const afterMap = indexByKey(after[name], key);

    const addedItems: any[] = [];
    const removedItems: any[] = [];
    let updatedHere = 0;

    for (const [id, item] of afterMap) {
      if (!beforeMap.has(id)) addedItems.push(item);
      else if (JSON.stringify(beforeMap.get(id)) !== JSON.stringify(item)) updatedHere++;
    }
    for (const [id, item] of beforeMap) {
      if (!afterMap.has(id)) removedItems.push(item);
    }

    if (!addedItems.length && !removedItems.length && !updatedHere) continue;

    added += addedItems.length;
    updated += updatedHere;
    removed += removedItems.length;

    const seg: string[] = [];
    if (addedItems.length) seg.push(`+${addedItems.length}`);
    if (updatedHere) seg.push(`✎${updatedHere}`);
    if (removedItems.length) seg.push(`−${removedItems.length}`);
    const sample = addedItems[0] || removedItems[0];
    const sampleLabel = sample ? ` (${labelOf(name, sample)})` : "";
    parts.push(`${COLLECTION_LABELS[name]}: ${seg.join(" ")}${sampleLabel}`);
  }

  if (!parts.length) return null;

  let action: string;
  if (added && !updated && !removed) action = "Добавление";
  else if (removed && !added && !updated) action = "Удаление";
  else if (updated && !added && !removed) action = "Изменение";
  else action = "Изменение данных";

  return { action, details: parts.join("; ").slice(0, 500) };
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

// Читаем тело потоково с жёстким лимитом по реальным байтам.
// Возвращает разобранный JSON, "TOO_LARGE" при превышении или {} при ошибке.
async function readJsonCapped(
  req: Request,
  limit: number,
): Promise<Record<string, unknown> | "TOO_LARGE"> {
  if (!req.body) return {};
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return "TOO_LARGE";
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const value = JSON.parse(new TextDecoder().decode(merged) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

