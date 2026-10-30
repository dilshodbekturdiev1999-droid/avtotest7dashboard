// Google Sheets: yangi akkauntdagi jadvallar (avto7 papkasi)
export const SHEETS_API_KEY = "AIzaSyAOaxr1LQUrHHNG1VhvQfgt6p__hezkvRk"; // yangi akkaunt (dilshod1999 loyihasi), faqat Sheets API

export const SHEET_IDS = {
  moliya:   "1uyCYnmXht_hsWnz19lAkhOq0Iu2yXI3vE1U8R4QcKDQ", // 1-jadval ( Moliya )
  rejadagi: "1haeTyt_Wi2K-fjN9KNopL-xbDBHS7NWPW3lPv9DbRwc", // Dilshod aka dashboard rasxod
  baza:     "1laraDETpMIT6CaVkOSLlmVqYizct6PVrbpemO6K4jtY", // 2-jadval ( Admin )
  davomat:  "1ZwoPyLdBa1OL1-q5fVty2pGoqtS586qssU3sf15jRms", // Oquvchilar davomat YANGI
  taklif:   "1iKOF_H3yHOxeu9mYVtadGYX4Ei_2fYLKQaBC_DZWZDE", // Taklifl va Shikoyalar anonim
};

// Jadvaldagi sanani yagona ko'rinishga keltiradi, yozuvdagi xato hisobni buzmasligi uchun: "19.10,2026", "19/10/2026" -> "19.10.2026"
export function normalizeSana(raw: string): string {
  return raw.trim().replace(/[,/\-\s]+/g, ".");
}

// Google Apps Script web ilovasi: jadvallarga yozish shu orqali (apps-script/Code.gs).
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzA1zqWaH2Jn_wkn2kfErogiIYxanoJT1UrkwzXDEffR9IFGT_ezR24cj29hIVMX5rzZw/exec";
export const SCRIPT_TOKEN = "a6fc188b45bf0d5333d3086801643578139c";
