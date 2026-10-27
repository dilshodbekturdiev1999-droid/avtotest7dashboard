import { SCRIPT_URL, SCRIPT_TOKEN } from "./sheets";

// Jadvalga yozish: Google Apps Script (apps-script/Code.gs). "text/plain" CORS preflight chiqmasligi uchun.
// Skript {ok:false,error} qaytarsa xato tashlaydi, shunda UI muvaffaqiyatsizlikni ko'rsata oladi.
export async function callScript(action: string, payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: SCRIPT_TOKEN, ...payload }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Xatolik");
  return data;
}
