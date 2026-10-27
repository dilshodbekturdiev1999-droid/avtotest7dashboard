/**
 * Avtotest7 dashboard: Google Sheets yozish xizmati (N8N o'rniga).
 *
 * Joylash: script.google.com -> yangi loyiha -> shu kodni qo'ying ->
 * Project Settings -> time zone = Asia/Tashkent
 * Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone
 * Chiqqan /exec URL ni src/lib/sheets.ts dagi SCRIPT_URL ga qo'ying.
 *
 * Skript jadvallar egasi (yoki ularga "Editor" huquqi bor akkaunt) nomidan ishlaydi.
 */

// Jadval ID lari (src/lib/sheets.ts bilan bir xil bo'lishi kerak)
const SHEET_IDS = {
  moliya:    '1uyCYnmXht_hsWnz19lAkhOq0Iu2yXI3vE1U8R4QcKDQ',
  rejadagi:  '1haeTyt_Wi2K-fjN9KNopL-xbDBHS7NWPW3lPv9DbRwc',
  baza:      '1laraDETpMIT6CaVkOSLlmVqYizct6PVrbpemO6K4jtY',
  davomat:   '1ZwoPyLdBa1OL1-q5fVty2pGoqtS586qssU3sf15jRms',
  taklif:    '1iKOF_H3yHOxeu9mYVtadGYX4Ei_2fYLKQaBC_DZWZDE',
};

// Mijoz (src/lib/sheets.ts) shu token bilan so'rov yuboradi
const TOKEN = 'a6fc188b45bf0d5333d3086801643578139c';

const TZ = 'Asia/Tashkent';

function doGet() {
  return json_({ ok: true, service: 'avtotest7-sheets' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.token !== TOKEN) return json_({ ok: false, error: 'Ruxsat yo\'q' });

    const handler = HANDLERS[body.action];
    if (!handler) return json_({ ok: false, error: 'Noma\'lum action: ' + body.action });

    lock.waitLock(20000);
    const result = handler(body) || {};
    SpreadsheetApp.flush();
    return json_(Object.assign({ ok: true }, result));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

const HANDLERS = {
  moliya_add:      moliyaAdd,
  rasxod_add:      rasxodAdd,
  rasxod_paid:     rasxodPaid,
  baza_add:        bazaAdd,
  baza_change:     bazaChange,
  davomat_mark:    davomatMark,
  davomat_edit:    davomatEdit,
  davomat_remove:  davomatRemove,
  davomat_add:     davomatAdd,
  taklif_add:      taklifAdd,
};

/* ---------------------------- Moliya ---------------------------- */
// A sana | B ism | C filial | D online/offline | E turi | F summa | G kirim/chiqim | H izoh | I chiqim turi
function moliyaAdd(b) {
  const sh = sheet_(SHEET_IDS.moliya, 'Moliya');
  const row = nextRow_(sh, [1, 2, 6]);
  prepareRow_(sh, row, 9);
  sh.getRange(row, 1, 1, 9).setValues([[
    date_(b.sana) || today_(), str_(b.ism), str_(b.filial), str_(b.online_offline), str_(b.turi),
    num_(b.summa), kirimChiqim_(b.kirim_chiqim), str_(b.izoh), str_(b.chiqim_turi),
  ]]);
  sh.getRange(row, 1).setNumberFormat('dd.MM.yyyy');
  return { row: row };
}

/* ---------------------------- Rejadagi rasxod ---------------------------- */
// A nomi | B sana | C summa | D status | E izoh
function rasxodAdd(b) {
  const sh = firstSheet_(SHEET_IDS.rejadagi);
  const row = nextRow_(sh, [1]);
  prepareRow_(sh, row, 5);
  sh.getRange(row, 1, 1, 5).setValues([[str_(b.nomi), date_(b.sana) || today_(), num_(b.summa), 'rejada', str_(b.izoh)]]);
  sh.getRange(row, 2).setNumberFormat('dd.MM.yyyy');
  return { row: row };
}

// To'langan rasxod rejadan o'chiriladi (N8N shunday qilgan)
function rasxodPaid(b) {
  const sh = firstSheet_(SHEET_IDS.rejadagi);
  const last = sh.getLastRow();
  if (last < 2) throw new Error('Rasxod topilmadi');
  const shown = sh.getRange(2, 1, last - 1, 5).getDisplayValues();
  const summa = digits_(b.summa);
  for (let i = 0; i < shown.length; i++) {
    const r = shown[i];
    if (r[0].trim() === str_(b.nomi) && r[1].trim() === str_(b.sana) &&
        digits_(r[2]) === summa && r[4].trim() === str_(b.izoh)) {
      sh.deleteRow(i + 2);
      return { deletedRow: i + 2 };
    }
  }
  throw new Error('Rasxod topilmadi (allaqachon o\'chirilgan bo\'lishi mumkin)');
}

/* ---------------------------- Baza (mijozlar) ---------------------------- */
// A № | B ism | C telefon | D filial | E dars kuni | F to'lov kuni | G dars vaqti | H to'lov | I to'landi | J qarz | K to'lov bekor | O hodim
function bazaAdd(b) {
  const sh = firstSheet_(SHEET_IDS.baza);
  const row = nextRow_(sh, [2]);
  prepareRow_(sh, row, 15);
  const r = sh.getRange(row, 1, 1, 15);
  const vals = r.getValues()[0];
  const prev = row > 2 ? sh.getRange(row - 1, 1).getValue() : 0;
  vals[0] = typeof prev === 'number' ? prev + 1 : 1;
  vals[1] = str_(b.ism);
  vals[2] = num_(b.telefon);
  vals[3] = str_(b.filial);
  vals[4] = date_(b.dars_kuni);
  vals[5] = date_(b.tolov_kuni);
  vals[6] = time_(b.dars_vaqti);
  vals[7] = num_(b.tolov);
  vals[8] = num_(b.tolandi);
  vals[9] = num_(b.qarzi);
  vals[14] = str_(b.hodim);
  r.setValues([vals]);
  sh.getRange(row, 5, 1, 2).setNumberFormat('dd.MM.yyyy');
  sh.getRange(row, 7).setNumberFormat('HH:mm');
  return { row: row };
}

function bazaChange(b) {
  const sh = firstSheet_(SHEET_IDS.baza);
  const row = Number(b.row);
  if (!(row >= 2) || row > sh.getLastRow()) throw new Error('Noto\'g\'ri qator: ' + b.row);
  const c = b.changes || {};
  const ch = function (k) { return c[k] ? c[k].new : undefined; };

  // Faqat "to'lov bekor" o'zgargan bo'lsa (N8N dagi kabi) shu katak yangilanadi
  if (c.tolov_bekor && c.tolov_bekor.new !== undefined && !c.ism) {
    sh.getRange(row, 11).setValue(str_(c.tolov_bekor.new));
    return { row: row };
  }
  setIf_(sh, row, 2, ch('ism'), str_);
  setIf_(sh, row, 3, ch('telefon'), num_);
  setIf_(sh, row, 4, ch('filial'), str_);
  setIf_(sh, row, 5, ch('dars_kuni'), date_, 'dd.MM.yyyy');
  setIf_(sh, row, 6, ch('tolov_kuni'), date_, 'dd.MM.yyyy');
  setIf_(sh, row, 7, ch('dars_vaqti'), time_, 'HH:mm');
  setIf_(sh, row, 8, ch('tolov'), num_);
  setIf_(sh, row, 9, ch('tolandi'), num_);
  setIf_(sh, row, 10, ch('qarzi'), num_);
  setIf_(sh, row, 11, ch('tolov_bekor'), str_);
  setIf_(sh, row, 15, ch('hodim'), str_);
  return { row: row };
}

/* ---------------------------- Davomat (o'quvchilar) ---------------------------- */
// A ism | B telefon | C filial | D smena | E sana | F holat | G imtihon | H prava oldi | I dars boshlanish
// J imtihondan yiqildi | K prava olish sanasi | L yiqilgan sana | M chetlatildi | N chetlatildi sanasi
// Har bir o'quvchida 1 ta "profil" qator (E bo'sh) va har kun uchun 1 ta davomat qatori (E, F to'ldirilgan) bor.
const DAV_COLS = 14;

function davomatRows_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, DAV_COLS).getValues();
}

function phoneKey_(v) {
  const d = digits_(v);
  return d.length > 9 ? d.slice(-9) : d;
}

function davomatMark(b) {
  const sh = firstSheet_(SHEET_IDS.davomat);
  const tel = phoneKey_(b.telefon);
  const sana = date_(b.sana) || today_();
  const dayKey = b.sana ? dmy_(b.sana) : Utilities.formatDate(new Date(), TZ, 'dd.MM.yyyy');
  const rows = davomatRows_(sh);
  const shown = rows.length ? sh.getRange(2, 5, rows.length, 1).getDisplayValues() : [];

  // Bir kunda ikki marta belgilansa, yangi qator qo'shmasdan holatni yangilaymiz
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (phoneKey_(r[1]) === tel && dmy_(shown[i][0]) === dayKey) {
      sh.getRange(i + 2, 6).setValue(str_(b.holat));
      return { row: i + 2, updated: true };
    }
  }
  const row = nextRow_(sh, [1]);
  prepareRow_(sh, row, DAV_COLS);
  sh.getRange(row, 1, 1, 6).setValues([[str_(b.ism), num_(b.telefon), str_(b.filial), time_(b.smena), sana, str_(b.holat)]]);
  sh.getRange(row, 4).setNumberFormat('HH:mm');
  sh.getRange(row, 5).setNumberFormat('dd.MM.yyyy');
  return { row: row };
}

function findProfileRow_(sh, rows, tel) {
  for (let i = 0; i < rows.length; i++) {
    if (phoneKey_(rows[i][1]) === tel && rows[i][4] === '') return i + 2;
  }
  return 0;
}

function davomatEdit(b) {
  const sh = firstSheet_(SHEET_IDS.davomat);
  const tel = phoneKey_(b.telefon);
  const rows = davomatRows_(sh);
  let row = findProfileRow_(sh, rows, tel);
  if (!row) {
    // Profil qatori yo'q bo'lsa, o'quvchining boshqa qatoridan nusxa olib yaratamiz
    const src = rows.filter(function (r) { return phoneKey_(r[1]) === tel; })[0];
    if (!src) throw new Error('O\'quvchi topilmadi: ' + b.telefon);
    row = nextRow_(sh, [1]);
    prepareRow_(sh, row, DAV_COLS);
    sh.getRange(row, 1, 1, 4).setValues([[src[0], src[1], src[2], src[3]]]);
  }
  sh.getRange(row, 7).setValue(date_(b.imtihon) || '');
  sh.getRange(row, 8).setValue(str_(b.prava_oldi));
  sh.getRange(row, 10, 1, 5).setValues([[
    str_(b.imtihondan_yiqildi), date_(b.prava_olish_sanasi) || '', date_(b.imtihondan_yiqilgan_sana) || '',
    str_(b.chetlatildi), date_(b.chetlatildi_sanasi) || '',
  ]]);
  sh.getRange(row, 7).setNumberFormat('dd.MM.yyyy');
  sh.getRange(row, 11, 1, 2).setNumberFormat('dd.MM.yyyy');
  sh.getRange(row, 14).setNumberFormat('dd.MM.yyyy');
  return { row: row };
}

function davomatRemove(b) {
  const sh = firstSheet_(SHEET_IDS.davomat);
  const tel = phoneKey_(b.telefon);
  const rows = davomatRows_(sh);
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) { // pastdan tepaga, qator raqamlari siljimasligi uchun
    if (phoneKey_(rows[i][1]) === tel) { sh.deleteRow(i + 2); n++; }
  }
  if (!n) throw new Error('O\'quvchi topilmadi: ' + b.telefon);
  return { deleted: n };
}

function davomatAdd(b) {
  const sh = firstSheet_(SHEET_IDS.davomat);
  const tel = phoneKey_(b.telefon);
  if (findProfileRow_(sh, davomatRows_(sh), tel)) throw new Error('Bu telefon raqamli o\'quvchi allaqachon bor');
  const row = nextRow_(sh, [1]);
  prepareRow_(sh, row, DAV_COLS);
  sh.getRange(row, 1, 1, 4).setValues([[str_(b.ism), num_(b.telefon), str_(b.filial), time_(b.smena)]]);
  sh.getRange(row, 9).setValue(date_(b.dars_boshlanish_sanasi) || '').setNumberFormat('dd.MM.yyyy');
  sh.getRange(row, 4).setNumberFormat('HH:mm');
  return { row: row };
}

/* ---------------------------- Taklif / Shikoyat (anonim) ---------------------------- */
// "Taklif" va "Shikoyat" varaqlari: A matn | B sana ("DD.MM.YYYY (HH:mm)")
function taklifAdd(b) {
  const ss = SpreadsheetApp.openById(SHEET_IDS.taklif);
  const sana = Utilities.formatDate(new Date(), TZ, 'dd.MM.yyyy (HH:mm)');
  const added = [];
  [['Taklif', b.taklif], ['Shikoyat', b.shikoyat]].forEach(function (p) {
    const text = str_(p[1]);
    if (!text) return;
    const sh = ss.getSheetByName(p[0]);
    if (!sh) throw new Error('Varaq topilmadi: ' + p[0]);
    const row = nextRow_(sh, [1, 2]);
    sh.getRange(row, 1, 1, 2).setNumberFormat('@').setValues([[text, sana]]);
    added.push(p[0]);
  });
  if (!added.length) throw new Error('Matn bo\'sh');
  return { added: added };
}

/* ---------------------------- Yordamchilar ---------------------------- */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function firstSheet_(id) {
  if (!id) throw new Error('Jadval ID si kiritilmagan');
  return SpreadsheetApp.openById(id).getSheets()[0];
}

function sheet_(id, name) {
  const sh = SpreadsheetApp.openById(id).getSheetByName(name);
  if (!sh) throw new Error('Varaq topilmadi: ' + name);
  return sh;
}

// Berilgan ustunlardan birortasi bo'sh bo'lmagan oxirgi qatordan keyingi qator.
// (appendRow ishlatilmaydi: jadval oxirida bo'sh joylar/probel bo'lsa, juda pastga yozib yuboradi)
function nextRow_(sh, cols) {
  const total = sh.getLastRow();
  let last = 1;
  cols.forEach(function (c) {
    if (total < 2) return;
    const v = sh.getRange(2, c, total - 1, 1).getDisplayValues();
    for (let i = v.length - 1; i >= 0; i--) {
      if (String(v[i][0]).trim() !== '') { last = Math.max(last, i + 2); break; }
    }
  });
  return last + 1;
}

// Oldingi qator formatini (valyuta, sana va h.k.) yangi qatorga ko'chiradi
function prepareRow_(sh, row, ncols) {
  if (row > 2) sh.getRange(row - 1, 1, 1, ncols).copyTo(sh.getRange(row, 1, 1, ncols), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  if (row > sh.getMaxRows()) return;
}

function setIf_(sh, row, col, value, conv, fmt) {
  if (value === undefined) return;
  const cell = sh.getRange(row, col);
  cell.setValue(conv(value) === null ? '' : conv(value));
  if (fmt) cell.setNumberFormat(fmt);
}

function str_(v) { return v === undefined || v === null ? '' : String(v).trim(); }

function digits_(v) { return String(v === undefined || v === null ? '' : v).replace(/\D/g, ''); }

// "1 290 000" / "-500000" / 1290000 -> son; bo'sh bo'lsa ''
function num_(v) {
  if (typeof v === 'number') return v;
  const s = str_(v).replace(/\s/g, '').replace(',', '.');
  if (s === '') return '';
  const n = Number(s);
  return isNaN(n) ? str_(v) : n;
}

// "DD.MM.YYYY" -> jadval sana raqami (1899-12-30 dan beri kunlar). Soat poyasi ta'sir qilmaydi, sana siljimaydi.
// Noto'g'ri bo'lsa null.
function date_(v) {
  const m = /^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/.exec(str_(v));
  if (!m) return null;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) / 86400000 + 25569;
}

function today_() { return date_(Utilities.formatDate(new Date(), TZ, 'dd.MM.yyyy')); }

// "1.7.2026" -> "01.07.2026"
function dmy_(v) {
  const m = /^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/.exec(str_(v));
  return m ? ('0' + m[1]).slice(-2) + '.' + ('0' + m[2]).slice(-2) + '.' + m[3] : str_(v);
}

// Jadvaldagi tekshiruv (data validation) faqat "Kirim" va "chiqim" ni qabul qiladi
function kirimChiqim_(v) { return str_(v).toLowerCase() === 'chiqim' ? 'chiqim' : 'Kirim'; }


// "HH:mm" -> kunning ulushi (jadvalda vaqt shunday saqlanadi)
function time_(v) {
  const m = /^(\d{1,2}):(\d{2})/.exec(str_(v));
  if (!m) return str_(v);
  return (Number(m[1]) * 60 + Number(m[2])) / 1440;
}
