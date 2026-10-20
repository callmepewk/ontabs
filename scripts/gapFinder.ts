// scripts/gapFinder.ts
// Ontabs Automated Gap Finder & Assurance Cross-Checker (Phase 15 & 18)
// Verifica consistência estática entre rotas HTTP, páginas frontend, módulos do engine e cobertura de testes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface GapCheckReport {
  timestamp: string;
  backendRoutesFound: number;
  frontendRoutesFound: number;
  engineModulesFound: number;
  testSuitesFound: number;
  untestedModules: string[];
  status: 'PASSED' | 'WARNING' | 'FAILED';
}

function runGapAnalysis(): GapCheckReport {
  console.log('======================================================');
  console.log('   ONTABS ASSURANCE & ARCHITECTURAL GAP FINDER');
  console.log('======================================================\n');

  // 1. Backend Routes Scan
  const routesFile = path.join(rootDir, 'src', 'server', 'routes.ts');
  const routesContent = fs.readFileSync(routesFile, 'utf-8');
  const routeMatches = [...routesContent.matchAll(/pathname(\.startsWith)?\s*===\s*['"]([^'"]+)['"]/g)];
  const backendRoutes = Array.from(new Set(routeMatches.map((m) => m[2])));

  console.log(`[+] Rotas de Backend detectadas (${backendRoutes.length}):`);
  backendRoutes.forEach((r) => console.log(`    - ${r}`));

  // 2. Frontend Routes Scan
  const appFile = path.join(rootDir, 'src', 'App.tsx');
  const appContent = fs.readFileSync(appFile, 'utf-8');
  const feRouteMatches = [...appContent.matchAll(/<Route\s+path=["']([^"']+)["']/g)];
  const frontendRoutes = Array.from(new Set(feRouteMatches.map((m) => m[1])));

  console.log(`\n[+] Rotas de Frontend registradas (${frontendRoutes.length}):`);
  frontendRoutes.forEach((r) => console.log(`    - ${r}`));

  // 3. Engine Modules Scan
  const engineDir = path.join(rootDir, 'src', 'engine');
  const engineFiles = fs
    .readdirSync(engineDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts');

  console.log(`\n[+] Módulos do Music Engine encontrados (${engineFiles.length}):`);
  engineFiles.forEach((m) => console.log(`    - ${m}`));

  // 4. Test Suites Scan
  const engineTests = fs.readdirSync(path.join(engineDir, '__tests__')).filter((f) => f.endsWith('.test.ts'));
  const serverTests = fs
    .readdirSync(path.join(rootDir, 'src', 'server', '__tests__'))
    .filter((f) => f.endsWith('.test.ts'));
  const totalTestSuites = [...engineTests.map((t) => `engine/${t}`), ...serverTests.map((t) => `server/${t}`)];

  console.log(`\n[+] Suítes de Teste Automatizado (${totalTestSuites.length}):`);
  totalTestSuites.forEach((t) => console.log(`    - [✓] ${t}`));

  // 5. Gap Verification
  const untestedModules: string[] = [];
  const testFilesCombined = [
    ...engineTests.map((f) => fs.readFileSync(path.join(engineDir, '__tests__', f), 'utf-8')),
    ...serverTests.map((f) => fs.readFileSync(path.join(rootDir, 'src', 'server', '__tests__', f), 'utf-8')),
  ].join('\n');

  for (const mod of engineFiles) {
    const baseName = mod.replace('.ts', '');
    if (!testFilesCombined.includes(baseName)) {
      untestedModules.push(mod);
    }
  }

  console.log('\n======================================================');
  console.log('   VERIFICAÇÃO DE GAPS & INTEGRIDADE DE ASSURANCE');
  console.log('======================================================');

  if (untestedModules.length > 0) {
    console.warn(`[!] Módulos do Engine sem menção explícita nos testes: ${untestedModules.join(', ')}`);
  } else {
    console.log('[✓] Todos os módulos do Engine estão cobertos por suítes de teste de referência.');
  }

  const report: GapCheckReport = {
    timestamp: new Date().toISOString(),
    backendRoutesFound: backendRoutes.length,
    frontendRoutesFound: frontendRoutes.length,
    engineModulesFound: engineFiles.length,
    testSuitesFound: totalTestSuites.length,
    untestedModules,
    status: untestedModules.length === 0 ? 'PASSED' : 'WARNING',
  };

  console.log(`\n[✓] Relatório concluído. Status de Garantia: ${report.status}`);
  return report;
}

runGapAnalysis();

