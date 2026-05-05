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
  const data = normalizeDb(body.data);
  const action = cleanText(body.action || "Изменение", 120);
  const details = cleanText(body.details || "", 500);

  const { error: stateError } = await adminClient
    .from("store_state")
    .upsert({
      id: "main",
      data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (stateError) {
    return json({ error: stateError.message }, 400);
  }

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

  return json({ ok: true }, 200);
});

function normalizeDb(value: unknown) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const products = Array.isArray(data.products)
    ? data.products.map((item) => {
      const product = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        ...product,
        photo: isPhotoPath(product.photo) ? product.photo : "",
      };
    })
    : [];

  return {
    products,
    arrivals: Array.isArray(data.arrivals) ? data.arrivals : [],
    sales: Array.isArray(data.sales) ? data.sales : [],
    returns: Array.isArray(data.returns) ? data.returns : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
  };
}

function isPhotoPath(value: unknown) {
  return /^[a-zA-Z0-9/_-]+\.webp$/.test(String(value || ""));
}

function cleanText(value: unknown, limit: number) {
  return String(value || "").slice(0, limit);
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
