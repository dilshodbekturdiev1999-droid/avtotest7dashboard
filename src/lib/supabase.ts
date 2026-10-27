// Supabase (asosiy loyiha: payments, allowed_phones, prava_on_expenses, terminal_expenses).
// Boshqa akkauntga o'tganda faqat shu ikki qiymat almashtiriladi.
export const SUPABASE_URL = "https://ziqzprosgzevkdfwyotl.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcXpwcm9zZ3pldmtkZnd5b3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MDAzMCwiZXhwIjoyMDgxOTE2MDMwfQ.vv56u5cQ0VToYDhyYGpbt2phr7PAwAbmtheY2h25yyQ";

export const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function sbCall(path: string, init: RequestInit): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...sbHeaders, ...init.headers } });
  if (!res.ok) throw new Error(`Supabase xatosi: ${res.status}`);
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/allowed_phones?select=id&telefon_raqami=eq.${encodeURIComponent(tel)}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(`Supabase xatosi: ${res.status}`);
  const existing: { id: number }[] = await res.json();
  if (existing.length) return sbCall(`allowed_phones?id=eq.${existing[0].id}`, { method: "PATCH", body: JSON.stringify(details) });
  await sbCall("allowed_phones", { method: "POST", body: JSON.stringify({ telefon_raqami: tel, ...details }) });
}

export function changePhone(id: number, telefon: string): Promise<void> {
  return sbCall(`allowed_phones?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ telefon_raqami: digits(telefon) }) });
}
