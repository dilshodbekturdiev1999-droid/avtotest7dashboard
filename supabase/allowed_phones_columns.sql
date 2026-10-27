-- Online dostup: ro'yxatda ism, to'lov summasi, sana, turi va filialni ham saqlash.
-- Barcha ustunlar ixtiyoriy, eski yozuvlar o'zgarmaydi. Supabase boshqa akkauntga o'tganda qayta ishga tushiring.
alter table public.allowed_phones
  add column if not exists ism text,
  add column if not exists summa bigint,
  add column if not exists sana text,
  add column if not exists turi text,
  add column if not exists filial text;
