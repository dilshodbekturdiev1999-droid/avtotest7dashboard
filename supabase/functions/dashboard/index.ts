// Dashboard uchun Supabase proksi. service_role kaliti faqat shu yerda (serverda) turadi, saytga tushmaydi.
// Faqat quyidagi jadvallar va amallarga ruxsat beriladi; sayt DASH_TOKEN yuboradi.
const ALLOWED: Record<string, string[]> = {
  allowed_phones: ["GET", "POST", "PATCH", "DELETE"],
  payments: ["GET"],
  prava_on_expenses: ["GET", "POST"],
  terminal_expenses: ["GET", "POST"],
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { token, method, path, body } = await req.json();
    if (!token || token !== Deno.env.get("DASH_TOKEN")) return json({ error: "unauthorized" }, 401);

    const m = String(method || "GET").toUpperCase();
    const p = String(path || "");
    const table = p.split("?")[0];
    // "(" taqiqlanadi: ?select=*,boshqa_jadval(*) orqali ruxsatsiz jadvallarni o'qib bo'lmasin
    if (!ALLOWED[table]?.includes(m) || p.includes("(") || p.includes("..")) return json({ error: "not allowed" }, 403);

    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${p}`, {
      method: m,
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return new Response(await r.text(), { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
