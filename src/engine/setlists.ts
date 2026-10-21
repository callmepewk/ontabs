// src/engine/setlists.ts
// Ontabs Band Rehearsal & Live Setlist Management (Phase 11)
// Preparação de repertório, afinações, observações de palco, cues e convenções de ensaio.

export interface SetlistItem {
  id: string;
  songId: string;
  title: string;
  artist: string;
  targetInstrument: string;
  tuning: string;
  bpm: number;
  targetBpm: number;
  key: string;
  stageNotes?: string;
  cueInSeconds?: number;
}

export interface Setlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  items: SetlistItem[];
  createdAt: string;
  updatedAt: string;
}

export function createEmptySetlist(name: string, userId = 'visitor'): Setlist {
  const now = new Date().toISOString();
  return {
    id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    name,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addSongToSetlist(
  setlist: Setlist,
  item: Omit<SetlistItem, 'id'>
): Setlist {
  const newItem: SetlistItem = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  return {
    ...setlist,
    items: [...setlist.items, newItem],
    updatedAt: new Date().toISOString(),
  };
}

export function reorderSetlistItems(setlist: Setlist, fromIndex: number, toIndex: number): Setlist {
  const items = [...setlist.items];
  const [removed] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, removed);
  return {
    ...setlist,
    items,
    updatedAt: new Date().toISOString(),
  };
}

export interface TuningTransition {
  fromIndex: number;
  toIndex: number;
  fromSong: string;
  toSong: string;
  fromTuning: string;
  toTuning: string;
}

export function detectTuningTransitions(setlist: Setlist): TuningTransition[] {
  const transitions: TuningTransition[] = [];
  for (let i = 0; i < setlist.items.length - 1; i++) {
    const cur = setlist.items[i];
    const next = setlist.items[i + 1];
    if (cur.tuning && next.tuning && cur.tuning.trim().toLowerCase() !== next.tuning.trim().toLowerCase()) {
      transitions.push({
        fromIndex: i,
        toIndex: i + 1,
        fromSong: cur.title,
        toSong: next.title,
        fromTuning: cur.tuning,
        toTuning: next.tuning,
      });
    }
  }
  return transitions;
}
