import express from "express";
import dotenv from "dotenv";
import { getNextSpot } from "./llm";
import { resolvePlaceIfNeeded, getDirections } from "./maps";

dotenv.config();

const app = express();
app.use(express.json());

function chunkText(s: string, max = 180): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of String(s).split(/\s+/)) {
    const cand = cur ? cur + " " + w : w;
    if (cand.length > max) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = cand;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function toDisplayActions(lines: string[], clearAfterMs = 10000) {
  const actions: any[] = lines.map((text) => ({ type: "display.text", text, priority: true }));
  if (clearAfterMs > 0) actions.push({ type: "display.clear", delayMs: clearAfterMs });
  return actions;
}

async function fetchLastTranscript(userId: string) {
  const qs = new URLSearchParams({
    apiKey: process.env.MENTRA_API_KEY || "",
    packageName: process.env.MENTRA_PACKAGE || "",
    userId
  });
  const r = await fetch(`https://api.mentra.glass/audio/${encodeURIComponent(userId)}?${qs.toString()}`);
  if (!r.ok) return "";
  const j: any = await r.json();
  const t = j?.transcripts?.[0]?.text || j?.items?.[0]?.text || "";
  return String(t || "");
}

app.get("/", (_req, res) => res.send("Mentra server OK"));

app.post("/mentra-test", async (_req, res) => {
  return res.json({ actions: toDisplayActions(["Test OK"], 5000) });
});

app.post("/mentra", async (req, res) => {
  try {

if (String(req.query?.test) === "1") {
  return res.json({
    actions: [
      { type: "display.text", text: "MENTRA TEST", priority: true },
      { type: "display.clear", delayMs: 8000 }
    ]
  });
}

    let userText: string | undefined =
      req.body?.message?.text ??
      req.body?.intentText ??
      req.body?.query ??
      undefined;

    const userId: string | undefined = req.body?.userId ?? req.query?.userId ?? undefined;
    if ((!userText || !String(userText).trim()) && userId) {
      const t = await fetchLastTranscript(userId);
      if (t && t.trim()) userText = t.trim();
    }

    const prompt = userText ?? "Find a nearby recommending spot";

    const origin = {
      lat: req.body?.location?.lat ?? 37.7749,
      lng: req.body?.location?.lng ?? -122.4194
    };

    const spot = await getNextSpot(origin);
    const target = await resolvePlaceIfNeeded(spot, origin);
    const dir = await getDirections(origin, target);

    const lines: string[] = [];
    if (userText) lines.push(`You said: ${userText}`);
    lines.push(`Recommendation: ${target.name}`);
    if ((target as any).address) lines.push(String((target as any).address));
    if (spot.reason) lines.push(`Why: ${spot.reason}`);
    if (dir.eta) lines.push(`ETA: ${dir.eta}`);
    if (dir.firstStep) lines.push(`First step: ${dir.firstStep}`);

    return res.json({ actions: toDisplayActions(chunkText(lines.join("\n"), 180), 10000) });
  } catch (err: any) {
    const msg = (err?.message || "Unknown error").toString().slice(0, 160);
    return res.json({ actions: toDisplayActions([`Error: ${msg}`], 8000) });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`[mentra] listening on port ${PORT}`));

