export type Phase = 'IDLE' | 'AWAIT_CONFIRM';

export interface Suggestion {
  name: string;
  reason?: string;
  lat?: number;
  lng?: number;
  place_id?: string;
}

export interface SessionState {
  phase: Phase;
  origin?: { lat: number; lng: number };
  suggestion?: Suggestion;
}

const store = new Map<string, SessionState>();

export function getState(sessionId: string): SessionState {
  if (!store.has(sessionId)) store.set(sessionId, { phase: 'IDLE' });
  return store.get(sessionId)!;
}

export function reset(sessionId: string) {
  store.set(sessionId, { phase: 'IDLE' });
}

