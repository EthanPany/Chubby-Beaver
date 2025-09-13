cat > src/llm.ts <<'TS'
type NextSpot = { name: string; reason?: string; lat?: number; lng?: number; place_id?: string };

export async function getNextSpot(origin: { lat: number; lng: number }): Promise<NextSpot> {
  const sys = `You are a trip assistant. Return ONE nearby place within ~2km of (${origin.lat},${origin.lng}).
Return strict JSON with fields: name, reason, and either (lat,lng) or place_id. No extra keys.`;

  const body = {
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: "I want suggestion for next spot" }
    ]
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const j: any = await r.json();
  const text = j?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(text);
  } catch {

    return { name: "Nearby Coffee", reason: "close & cozy", lat: origin.lat + 0.001, lng: origin.lng + 0.001 };
  }
}
TS

