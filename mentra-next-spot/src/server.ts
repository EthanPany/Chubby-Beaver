cat > src/server.ts <<'TS'
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { getState, reset } from './state.js';
import { getNextSpot } from './llm.js';
import { resolvePlaceIfNeeded, getDirections } from '../../../HackMIT2025/maps.js';

const app = express();
app.use(express.json());

async function sendDisplay(sessionId: string, text: string) {
  console.log(`[display][${sessionId}] ${text}`);
}

function pullText(body: any): string {
  return body?.text ?? body?.message ?? body?.payload?.text ?? '';
}
function pullSessionId(body: any): string {
  return body?.sessionId ?? body?.session?.id ?? body?.conversationId ?? 'unknown';
}
function pullOrigin(body: any): {lat:number; lng:number} | undefined {
  const lat = body?.location?.lat ?? body?.origin?.lat;
  const lng = body?.location?.lng ?? body?.origin?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
  return undefined;
}

app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const sessionId = pullSessionId(body);
    const textRaw = pullText(body).toLowerCase().trim();
    const type = body?.type ?? body?.event ?? 'unknown';
    const st = getState(sessionId);

    console.log('👉 event:', { type, sessionId, textRaw });

    if (st.phase === 'IDLE' && /i want (a )?suggestion for next spot/.test(textRaw)) {
      st.phase = 'AWAIT_CONFIRM';
      st.origin = pullOrigin(body) ?? { lat: 42.3601, lng: -71.0942 };

      await sendDisplay(sessionId, 'Getting a suggestion…');

      const raw = await getNextSpot(st.origin);
      const sug = await resolvePlaceIfNeeded(raw, st.origin);
      st.suggestion = sug;

      await sendDisplay(
        sessionId,
        `How about: ${sug.name}\nSay "yes" to navigate or "no" to cancel.`
      );

      return res.sendStatus(200);
    }

    // yes/no
    if (st.phase === 'AWAIT_CONFIRM') {
      if (/\byes\b/.test(textRaw)) {
        if (!st.origin || !st.suggestion) {
          await sendDisplay(sessionId, 'No suggestion in memory. Say the trigger again.');
          reset(sessionId);
          return res.sendStatus(200);
        }
        const route = await getDirections(st.origin, st.suggestion);
        await sendDisplay(
          sessionId,
          `Navigating to ${st.suggestion.name}\nETA ${route.eta}\n${route.firstStep}`
        );
        reset(sessionId);
        return res.sendStatus(200);
      }
      if (/\bno\b/.test(textRaw)) {
        await sendDisplay(sessionId, 'OK, cancelled.');
        reset(sessionId);
        return res.sendStatus(200);
      }
    }

    return res.sendStatus(200);
  } catch (e: any) {
    console.error('[webhook] error:', e);
    return res.sendStatus(200);
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`[mentra] listening on port ${PORT}`));
TS

