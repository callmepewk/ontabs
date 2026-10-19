// src/engine/collectiveArrangement.ts
// Ontabs Collective Arrangement Intelligence (Annex ONTABS-ANNEX-COLLECTIVE-MUSIC-001)
// Análise de múltiplas partes, inteligência de duas guitarras, relações entre faixas e mapa de arranjo.

import { FunctionalRole, MusicalProvenance, PartRelationship } from '@/types/domain';
import { IntermediateMusicalRepresentation, MusicalNoteEvent } from './intermediateRepresentation';

export interface PartRelationshipSegment {
  trackAId: string;
  trackBId: string;
  startTime: number;
  endTime: number;
  relationship: PartRelationship;
  confidence: number;
  evidence: string;
  provenance: MusicalProvenance;
}

export interface TransitionEvent {
  id: string;
  timestamp: number;
  transitionType:
    | 'section_change'
    | 'drum_fill'
    | 'collective_break'
    | 'instrument_entry'
    | 'instrument_exit'
    | 'tempo_change';
  fromSection?: string;
  toSection?: string;
  activeInstrumentChanges: { entered: string[]; exited: string[] };
  confidence: number;
  provenance: MusicalProvenance;
}

export interface ArrangementMap {
  songId: string;
  title: string;
  totalDurationSeconds: number;
  tracks: {
    id: string;
    name: string;
    instrument: string;
    role: FunctionalRole;
    intervals: { start: number; end: number; noteCount: number }[];
  }[];
  relationships: PartRelationshipSegment[];
  transitions: TransitionEvent[];
}

/**
 * Classifica a relação musical entre dois conjuntos de notas sobrepostos no tempo.
 * Avalia uníssonos, oitavas, harmonizações, complementos rítmicos e linhas independentes.
 */
export function classifyPartRelationship(
  notesA: MusicalNoteEvent[],
  notesB: MusicalNoteEvent[],
  toleranceSeconds = 0.08
): PartRelationshipSegment[] {
  const segments: PartRelationshipSegment[] = [];
  if (notesA.length === 0 || notesB.length === 0) return segments;

  // Janelas de tempo agrupadas em blocos de 2 a 4 segundos
  const startTime = Math.min(notesA[0].timestamp, notesB[0].timestamp);
  const endTime = Math.max(
    notesA[notesA.length - 1].timestamp + notesA[notesA.length - 1].duration,
    notesB[notesB.length - 1].timestamp + notesB[notesB.length - 1].duration
  );

  const windowSize = 2.0; // segundos por segmento de análise
  for (let t = startTime; t < endTime; t += windowSize) {
    const tEnd = t + windowSize;
    const subA = notesA.filter((n) => n.timestamp >= t && n.timestamp < tEnd);
    const subB = notesB.filter((n) => n.timestamp >= t && n.timestamp < tEnd);

    if (subA.length === 0 || subB.length === 0) continue;

    // 1. Pareamento de notas simultâneas
    let unisons = 0;
    let octaves = 0;
    let harmonized = 0;
    let simultaneousPairs = 0;

    for (const a of subA) {
      const match = subB.find((b) => Math.abs(b.timestamp - a.timestamp) <= toleranceSeconds);
      if (match) {
        simultaneousPairs++;
        const midiDiff = Math.abs(a.midi - match.midi);
        if (midiDiff === 0) {
          unisons++;
        } else if (midiDiff === 12 || midiDiff === 24) {
          octaves++;
        } else if (midiDiff === 3 || midiDiff === 4 || midiDiff === 7 || midiDiff === 9) {
          // Terças, quartas, quintas, sextas
          harmonized++;
        }
      }
    }

    let rel: PartRelationship = 'UNKNOWN_RELATION';
    let confidence = 0.5;
    let evidence = 'Evidência insuficiente';

    if (simultaneousPairs > 0) {
      if (unisons / simultaneousPairs >= 0.7) {
        rel = 'UNISON';
        confidence = Number((unisons / simultaneousPairs).toFixed(2));
        evidence = `${unisons} notas em uníssono exato detectadas`;
      } else if (octaves / simultaneousPairs >= 0.6) {
        rel = 'OCTAVE_DOUBLING';
        confidence = Number((octaves / simultaneousPairs).toFixed(2));
        evidence = `${octaves} notas em oitavas paralelas detectadas`;
      } else if (harmonized / simultaneousPairs >= 0.6) {
        rel = 'HARMONIZED';
        confidence = Number((harmonized / simultaneousPairs).toFixed(2));
        evidence = `${harmonized} notas em terças/quintas harmonizadas detectadas`;
      } else if (simultaneousPairs >= 2) {
        rel = 'INDEPENDENT_LINES';
        confidence = 0.7;
        evidence = 'Linhas simultâneas com contorno melódico e intervalos variados';
      }
    } else {
      // Sem notas exatamente simultâneas: verifica complemento rítmico (intercaladas)
      rel = 'RHYTHMIC_COMPLEMENT';
      confidence = 0.65;
      evidence = 'Ataques rítmicos alternados entre as duas partes';
    }

    segments.push({
      trackAId: 'trackA',
      trackBId: 'trackB',
      startTime: Number(t.toFixed(2)),
      endTime: Number(tEnd.toFixed(2)),
      relationship: rel,
      confidence,
      evidence,
      provenance: 'INFERRED',
    });
  }

  return segments;
}

/**
 * Inteligência de Duas Guitarras (Double Guitar Intelligence)
 * Avalia duas pistas de guitarra para inferir papéis funcionais prováveis (Rhythm vs. Lead).
 */
export function inferDoubleGuitarRoles(
  guitarA: MusicalNoteEvent[],
  guitarB: MusicalNoteEvent[]
): {
  roleA: FunctionalRole;
  roleB: FunctionalRole;
  confidence: number;
  reason: string;
} {
  if (guitarA.length === 0 && guitarB.length === 0) {
    return { roleA: 'unassigned', roleB: 'unassigned', confidence: 0.1, reason: 'Pistas vazias' };
  }

  const avgPitchA = guitarA.length > 0 ? guitarA.reduce((sum, n) => sum + n.midi, 0) / guitarA.length : 60;
  const avgPitchB = guitarB.length > 0 ? guitarB.reduce((sum, n) => sum + n.midi, 0) / guitarB.length : 60;

  const durationA = guitarA.length > 0 ? guitarA[guitarA.length - 1].timestamp - guitarA[0].timestamp || 1 : 1;
  const durationB = guitarB.length > 0 ? guitarB[guitarB.length - 1].timestamp - guitarB[0].timestamp || 1 : 1;

  const densityA = guitarA.length / durationA; // notas por segundo
  const densityB = guitarB.length / durationB;

  // A guitarra solo tende a ter tessitura mais aguda (pitch maior) e maior variação melódica/técnica
  if (avgPitchA > avgPitchB + 5 || densityA > densityB * 1.5) {
    return {
      roleA: 'lead',
      roleB: 'rhythm',
      confidence: 0.82,
      reason: 'Guitarra A possui registro médio mais agudo e maior densidade melódica que a Guitarra B.',
    };
  } else if (avgPitchB > avgPitchA + 5 || densityB > densityA * 1.5) {
    return {
      roleA: 'rhythm',
      roleB: 'lead',
      confidence: 0.82,
      reason: 'Guitarra B possui registro médio mais agudo e maior densidade melódica que a Guitarra A.',
    };
  }

  return {
    roleA: 'rhythm',
    roleB: 'harmonic_support',
    confidence: 0.6,
    reason: 'Ambas as guitarras atuam em tessituras e densidades semelhantes, sugerindo acompanhamento complementar.',
  };
}

/**
 * Constrói o Arrangement Map completo a partir da representação musical intermediária.
 */
export function buildArrangementMap(ir: IntermediateMusicalRepresentation): ArrangementMap {
  const tracksSummary = Object.values(ir.tracks).map((t) => {
    // Agrupa notas em intervalos contínuos de atividade
    const intervals: { start: number; end: number; noteCount: number }[] = [];
    if (t.notes.length > 0) {
      let curStart = t.notes[0].timestamp;
      let lastEnd = curStart + t.notes[0].duration;
      let count = 1;

      for (let i = 1; i < t.notes.length; i++) {
        const n = t.notes[i];
        if (n.timestamp - lastEnd <= 3.0) {
          lastEnd = Math.max(lastEnd, n.timestamp + n.duration);
          count++;
        } else {
          intervals.push({ start: Number(curStart.toFixed(2)), end: Number(lastEnd.toFixed(2)), noteCount: count });
          curStart = n.timestamp;
          lastEnd = curStart + n.duration;
          count = 1;
        }
      }
      intervals.push({ start: Number(curStart.toFixed(2)), end: Number(lastEnd.toFixed(2)), noteCount: count });
    }

    return {
      id: t.id,
      name: t.name,
      instrument: t.instrument,
      role: t.role,
      intervals,
    };
  });

  // Detecta transições entre seções definidas
  const transitions: TransitionEvent[] = [];
  for (let i = 1; i < ir.sections.length; i++) {
    const prevSec = ir.sections[i - 1];
    const curSec = ir.sections[i];

    const prevInst = prevSec.activeInstruments || [];
    const curInst = curSec.activeInstruments || [];

    const entered = curInst.filter((inst) => !prevInst.includes(inst));
    const exited = prevInst.filter((inst) => !curInst.includes(inst));

    transitions.push({
      id: `tr_${i}`,
      timestamp: curSec.startTime,
      transitionType: 'section_change',
      fromSection: prevSec.name,
      toSection: curSec.name,
      activeInstrumentChanges: { entered, exited },
      confidence: 0.9,
      provenance: 'INFERRED',
    });
  }

  return {
    songId: ir.songId,
    title: ir.title,
    totalDurationSeconds: ir.durationSeconds,
    tracks: tracksSummary,
    relationships: [],
    transitions,
  };
}
