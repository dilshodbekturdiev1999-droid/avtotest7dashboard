import { useState } from "react";
import { Loader2 } from "lucide-react";
import { callScript } from "@/lib/api";

// Ochiq (loginsiz) sahifa: /taklif. O'quvchilar anonim taklif va shikoyat yuboradi (oldin N8N formasi edi).
const AnonimForm = () => {
  const [taklif, setTaklif] = useState("");
  const [shikoyat, setShikoyat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit() {
    if (!taklif.trim() && !shikoyat.trim()) { setResult("❌ Kamida bittasini yozing"); return; }
    setLoading(true); setResult(null);
    try {
      await callScript("taklif_add", { taklif, shikoyat });
      setResult("✅ Rahmat! Fikringiz anonim tarzda yuborildi");
      setTaklif(""); setShikoyat("");
    } catch (e) { setResult(`❌ ${(e as Error).message}`); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-border p-6">
        <h1 className="text-xl font-semibold mb-1">Taklif va Shikoyatlar (Anonim)</h1>
        <p className="text-sm text-muted-foreground mb-5">Avtotest7 uchun sizning fikringiz muhim, barchasi anonim tarzda</p>

        <label className="text-xs text-muted-foreground mb-1 block">Sizda TAKLIF bormi?</label>
        <textarea value={taklif} onChange={e => setTaklif(e.target.value)} rows={4} placeholder="Taklifingizni yozing..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-4" />

        <label className="text-xs text-muted-foreground mb-1 block">Sizda SHIKOYAT bormi?</label>
        <textarea value={shikoyat} onChange={e => setShikoyat(e.target.value)} rows={4} placeholder="Shikoyatingizni yozing..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-4" />

        <button onClick={submit} disabled={loading}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Yuborish
        </button>
        {result && <p className="text-sm mt-3 text-center">{result}</p>}
      </div>
    </div>
  );
};

export default AnonimForm;
