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
    return json({ error: "Only logged-in users can create users" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .single();

  if (roleError || roleRow?.role !== "admin") {
    return json({ error: "Only admins can create users" }, 403);
  }

  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanEmail || cleanPassword.length < 6) {
    return json({ error: "Email and password with at least 6 characters are required" }, 400);
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPassword,
    email_confirm: true,
  });

  if (error) {
    return json({ error: error.message }, 400);
  }

  if (!data.user?.id) {
    return json({ error: "User was not created" }, 500);
  }

  const { error: roleUpsertError } = await adminClient
    .from("user_roles")
    .upsert({ user_id: data.user.id, role: "manager" }, { onConflict: "user_id" });

  if (roleUpsertError) {
    await adminClient.auth.admin.deleteUser(data.user.id);
    return json({ error: `User role was not saved: ${roleUpsertError.message}` }, 500);
  }

  const { error: changeError } = await adminClient
    .from("store_changes")
    .insert({
      user_id: authData.user.id,
      user_email: authData.user.email || "unknown",
      action: "Создание пользователя",
      details: cleanEmail,
    });

  return json({
    id: data.user.id,
    email: data.user.email,
    warning: changeError ? `User was created, but history was not saved: ${changeError.message}` : undefined,
  }, 200);
});

