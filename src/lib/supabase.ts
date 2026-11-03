// Supabase (asosiy loyiha: payments, allowed_phones, prava_on_expenses, terminal_expenses).
// Sayt Supabase ga to'g'ridan-to'g'ri emas, serverdagi "dashboard" funksiyasi orqali murojaat qiladi
// (supabase/functions/dashboard): service_role kaliti saytga tushmaydi, funksiya faqat shu 4 jadvalga ruxsat beradi.
// Boshqa akkauntga o'tganda faqat shu ikki qiymat almashtiriladi.
export const SB_FUNCTION_URL = "https://vywzulllyxlhynxgmpqc.supabase.co/functions/v1/dashboard";
export const SB_FUNCTION_TOKEN = "5d04aab453640ac3e57544cf36fc033fcc04698cb580761d";

// PostgREST so'rovi: sb("payments?status=eq.success"), sb("allowed_phones", { method: "POST", body: {...} })
// "text/plain" CORS preflight chiqmasligi uchun. HTTP xato bo'lsa xato tashlaydi.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sb(path: string, opts: { method?: string; body?: unknown } = {}): Promise<any> {
  const res = await fetch(SB_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: SB_FUNCTION_TOKEN, method: opts.method ?? "GET", path, body: opts.body }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase xatosi: ${res.status}`);
  return text ? JSON.parse(text) : null;
}

// Bazadagi telefonlar 9 xonali (998 siz) saqlanadi
const digits = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d.length > 9 ? d.slice(-9) : d;
};

export interface AccessDetails {
  ism?: string;
  summa?: number | null;
  sana?: string;   // "DD.MM.YYYY"
  turi?: string;   // Offline | Online
  filial?: string;
}

// Onlayn dostup ruxsat etilgan telefonlar ro'yxatiga qo'shish.
// Raqam allaqachon bor bo'lsa, yangi qator qo'shilmaydi: ma'lumotlari yangilanadi.
export async function allowPhone(telefon: string, details: AccessDetails = {}): Promise<void> {
  const tel = digits(telefon);
  const existing: { id: number }[] = await sb(`allowed_phones?select=id&telefon_raqami=eq.${encodeURIComponent(tel)}`);
  if (existing.length) { await sb(`allowed_phones?id=eq.${existing[0].id}`, { method: "PATCH", body: details }); return; }
  await sb("allowed_phones", { method: "POST", body: { telefon_raqami: tel, ...details } });
}

export async function changePhone(id: number, telefon: string): Promise<void> {
  await sb(`allowed_phones?id=eq.${id}`, { method: "PATCH", body: { telefon_raqami: digits(telefon) } });
}
