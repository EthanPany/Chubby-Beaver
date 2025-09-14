export async function routeTo(args: {
  lat: number;
  lng: number;
  mode?: "walking" | "driving" | "transit" | "bicycling";
}): Promise<{
  etaMinutes?: number;   
  distanceKm?: number;    
  polyline?: string;      
}>;

export async function resolvePlaceIfNeeded(
  s: { name: string; lat?: number; lng?: number; place_id?: string },
  origin: { lat: number; lng: number }
) {
  if (s.place_id || (s.lat !== undefined && s.lng !== undefined)) return s;

  const qs = new URLSearchParams({
    query: `${s.name} near ${origin.lat},${origin.lng}`,
    key: process.env.GOOGLE_MAPS_KEY!
  });
  const rr = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${qs.toString()}`);
  const jj: any = await rr.json();
  const place_id = jj?.results?.[0]?.place_id;
  if (place_id) return { ...s, place_id };
  return s;
}

export async function getDirections(
  origin: { lat: number; lng: number },
  dest: { lat?: number; lng?: number; place_id?: string }
) {
  const destination = dest.place_id ? `place_id:${dest.place_id}` : `${dest.lat},${dest.lng}`;
  const qs = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination,
    mode: "walking",
    key: process.env.GOOGLE_MAPS_KEY!
  });

  const r = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${qs.toString()}`);
  const j: any = await r.json();
  const leg = j?.routes?.[0]?.legs?.[0];

  const eta = leg?.duration?.text ?? "N/A";
  const firstHtml = leg?.steps?.[0]?.html_instructions ?? "";
  const firstStep = firstHtml.replace(/<[^>]+>/g, "");

  return { eta, firstStep };
}

