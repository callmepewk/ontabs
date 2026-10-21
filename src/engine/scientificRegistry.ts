// src/engine/scientificRegistry.ts
// OnTabs Scientific Formulation Registry & Canonical Corpus Validator
// Autor do Corpus Canônico Original: Pedro Henrique Brezolin de Freitas (JIMI / OmniCore)
// Governança: JIMI SIGNS THE ANALYSIS. PEDRO SIGNS THE AUTHORITY.

import manifestJson from '../../docs/scientific-registry/registry_manifest.json';

export interface CanonicalFormulation {
  id: string;
  name: string;
  formula: string;
  definition: string;
  status: 'DISCOVERED' | 'FORMALIZED' | 'IMPLEMENTED' | 'UNIT_TESTED' | 'EXPERIMENTALLY_VALIDATED' | 'INTEGRATED' | 'UNVERIFIED' | 'VERIFIED' | 'HYPOTHESIS_FORMALIZED';
  ontabsMapping?: string;
  domain?: string;
  variables?: Record<string, string>;
  precision?: string;
  implementation?: string;
  tests?: string;
}

export interface FormulationBlock {
  id: string;
  name: string;
  range: string;
  formulations: CanonicalFormulation[];
}

export interface ScientificRegistryManifest {
  corpus: {
    title: string;
    author: string;
    affiliation: string;
    consolidationDate: string;
    registration: string;
    epistemologicalStatus: string;
    invariant: string;
    chainOfCustody: string;
    governance: string;
    totalFoundationalFormulations: number;
    totalMusicDSPFormulations: number;
    totalProposedFormulations: number;
  };
  blocks: FormulationBlock[];
  musicDSPFormulations: CanonicalFormulation[];
  proposedFormulations: CanonicalFormulation[];
}

export function loadScientificRegistry(): ScientificRegistryManifest {
  return manifestJson as unknown as ScientificRegistryManifest;
}

export function getAllCanonicalFormulations(registry?: ScientificRegistryManifest): CanonicalFormulation[] {
  const reg = registry || loadScientificRegistry();
  const list: CanonicalFormulation[] = [];
  for (const block of reg.blocks) {
    list.push(...block.formulations);
  }
  return list;
}

export function getFormulationById(id: string, registry?: ScientificRegistryManifest): CanonicalFormulation | null {
  const reg = registry || loadScientificRegistry();
  const searchId = id.trim().toLowerCase();

  const matches = (f: CanonicalFormulation) => {
    if (f.id.toLowerCase() === searchId) return true;
    const parts = f.id.split('/').map((s) => s.trim().toLowerCase());
    return parts.includes(searchId);
  };

  for (const block of reg.blocks) {
    const found = block.formulations.find(matches);
    if (found) return found;
  }
  const foundDsp = reg.musicDSPFormulations.find(matches);
  if (foundDsp) return foundDsp;
  const foundProp = reg.proposedFormulations.find(matches);
  if (foundProp) return foundProp;
  return null;
}

export function validateCorpusIntegrity(registry?: ScientificRegistryManifest): {
  valid: boolean;
  totalFoundational: number;
  totalDsp: number;
  totalProposed: number;
  errors: string[];
} {
  const reg = registry || loadScientificRegistry();
  const errors: string[] = [];

  const allFoundational = getAllCanonicalFormulations(reg);
  if (allFoundational.length !== 64) {
    errors.push(`Esperava-se exatamente 64 formulações fundacionais, mas foram encontradas ${allFoundational.length}.`);
  }

  // Verifica unicidade de IDs
  const seenIds = new Set<string>();
  for (const f of allFoundational) {
    if (seenIds.has(f.id)) {
      errors.push(`ID de formulação duplicado encontrado: ${f.id}`);
    }
    seenIds.add(f.id);

    if (!f.formula || f.formula.trim().length === 0) {
      errors.push(`Formulação ${f.id} possui expressão matemática vazia.`);
    }
    if (!f.definition || f.definition.trim().length === 0) {
      errors.push(`Formulação ${f.id} possui definição vazia.`);
    }
  }

  if (reg.musicDSPFormulations.length !== 10) {
    errors.push(`Esperava-se 10 formulações DSP de música, encontradas ${reg.musicDSPFormulations.length}.`);
  }

  return {
    valid: errors.length === 0,
    totalFoundational: allFoundational.length,
    totalDsp: reg.musicDSPFormulations.length,
    totalProposed: reg.proposedFormulations.length,
    errors,
  };
}
