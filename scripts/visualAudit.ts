// scripts/visualAudit.ts
// Ontabs Automated Visual & UX Regression Suite (Gate B)
// Executa auditoria visual via Playwright headless com Microsoft Edge em Viewports Desktop (1920x1080) e Mobile (375x812).

import { chromium, Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotDir = path.join(rootDir, 'docs', 'assurance', 'screenshots');

const BASE_URL = 'http://127.0.0.1:3001';

interface ViewportAuditResult {
  route: string;
  viewport: 'desktop_1920x1080' | 'mobile_375x812';
  screenshotPath: string;
  hasHorizontalOverflow: boolean;
  scrollWidth: number;
  clientWidth: number;
  consoleErrors: string[];
  status: 'PASS' | 'FAIL';
}

async function auditRoute(
  page: Page,
  route: string,
  viewportName: 'desktop_1920x1080' | 'mobile_375x812',
  fileName: string
): Promise<ViewportAuditResult> {
  const consoleErrors: string[] = [];
  const errorHandler = (msg: any) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  };
  page.on('console', errorHandler);

  const fullUrl = `${BASE_URL}${route}`;
  await page.goto(fullUrl, { waitUntil: 'networkidle' });

  // Aguarda renderização completa da SPA
  await page.waitForTimeout(500);

  // Verificação matemática de horizontal overflow
  const dimensions = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    };
  });

  const hasHorizontalOverflow = dimensions.scrollWidth > dimensions.clientWidth + 1; // 1px margin of error for subpixel

  // Captura de Screenshot PNG real
  const filePath = path.join(screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: false });

  page.off('console', errorHandler);

  return {
    route,
    viewport: viewportName,
    screenshotPath: filePath,
    hasHorizontalOverflow,
    scrollWidth: dimensions.scrollWidth,
    clientWidth: dimensions.clientWidth,
    consoleErrors,
    status: !hasHorizontalOverflow && consoleErrors.length === 0 ? 'PASS' : 'FAIL',
  };
}

async function runVisualAudit() {
  console.log('======================================================');
  console.log('   ONTABS VISUAL & UX AUDIT RUNNER (GATE B)');
  console.log('======================================================\n');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const results: ViewportAuditResult[] = [];

  try {
    // 1. Auditoria Desktop (1920x1080)
    console.log('[+] Iniciando Auditoria Desktop (1920x1080)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();

    const routesToTest = [
      { route: '/', name: 'desktop_landing_home.png' },
      { route: '/library', name: 'desktop_library_page.png' },
      { route: '/play', name: 'desktop_play_selector.png' },
      { route: '/converter', name: 'desktop_converter_page.png' },
      { route: '/planos', name: 'desktop_plans_page.png' },
      { route: '/setlists', name: 'desktop_setlists_page.png' },
      { route: '/login', name: 'desktop_login_page.png' },
      { route: '/register', name: 'desktop_register_page.png' },
    ];

    for (const r of routesToTest) {
      console.log(`    - Testando rota ${r.route}...`);
      const res = await auditRoute(desktopPage, r.route, 'desktop_1920x1080', r.name);
      results.push(res);
      console.log(`      Resultado: ${res.status} (Overflow: ${res.hasHorizontalOverflow ? 'SIM' : 'NÃO'}, Erros de Console: ${res.consoleErrors.length})`);
    }

    // Teste de Interação Real no OnTabs Play: Clicar no botão da Demo Sintética
    console.log('    - Testando Interação de Entrada no OnTabs Play (/play -> Canon Rock)...');
    await desktopPage.goto(`${BASE_URL}/play`);
    await desktopPage.waitForTimeout(500);
    const demoButton = desktopPage.locator('button:has-text("Jogar Canon Rock")');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await desktopPage.waitForTimeout(600);
      const inGameScreenshot = path.join(screenshotDir, 'desktop_play_in_game_pregame.png');
      await desktopPage.screenshot({ path: inGameScreenshot });
      console.log('      Screenshot da tela de jogo capturada: desktop_play_in_game_pregame.png');
    }

    // Teste de Paginação Real na Biblioteca: Clicar na página 2
    console.log('    - Testando Interação de Paginação por Clique na Biblioteca (/library)...');
    await desktopPage.goto(`${BASE_URL}/library`);
    await desktopPage.waitForTimeout(500);
    const page2Button = desktopPage.locator('button:has-text("2")').first();
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await desktopPage.waitForTimeout(400);
      const paginatedScreenshot = path.join(screenshotDir, 'desktop_library_page_2_active.png');
      await desktopPage.screenshot({ path: paginatedScreenshot });
      console.log('      Screenshot da página 2 capturada: desktop_library_page_2_active.png');
    }

    await desktopContext.close();

    // 2. Auditoria Mobile (375x812 - iPhone X / Modern Mobile)
    console.log('\n[+] Iniciando Auditoria Mobile (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();

    const mobileRoutesToTest = [
      { route: '/', name: 'mobile_landing_home.png' },
      { route: '/library', name: 'mobile_library_page.png' },
      { route: '/play', name: 'mobile_play_selector.png' },
      { route: '/converter', name: 'mobile_converter_page.png' },
      { route: '/planos', name: 'mobile_plans_page.png' },
    ];

    for (const r of mobileRoutesToTest) {
      console.log(`    - Testando rota ${r.route} (Mobile)...`);
      const res = await auditRoute(mobilePage, r.route, 'mobile_375x812', r.name);
      results.push(res);
      console.log(`      Resultado: ${res.status} (Overflow: ${res.hasHorizontalOverflow ? 'SIM' : 'NÃO'}, Erros de Console: ${res.consoleErrors.length})`);
    }

    await mobileContext.close();
  } finally {
    await browser.close();
  }

  // Gera Relatório Consolidado de Auditoria Visual
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const overflowIssues = results.filter((r) => r.hasHorizontalOverflow);
  const consoleErrorIssues = results.filter((r) => r.consoleErrors.length > 0);

  console.log('\n======================================================');
  console.log(`   RESULTADO FINAL DA AUDITORIA VISUAL: ${passed}/${total} APROVADOS`);
  console.log(`   Overflows Horizontais: ${overflowIssues.length}`);
  console.log(`   Erros de Console JS: ${consoleErrorIssues.length}`);
  console.log('======================================================\n');

  const reportJson = {
    timestamp: new Date().toISOString(),
    totalTests: total,
    passed,
    failed: total - passed,
    overflowIssues: overflowIssues.map((o) => ({ route: o.route, viewport: o.viewport, scrollWidth: o.scrollWidth, clientWidth: o.clientWidth })),
    consoleErrors: consoleErrorIssues.map((c) => ({ route: c.route, viewport: c.viewport, errors: c.errors })),
    screenshotsGenerated: results.map((r) => r.screenshotPath),
  };

  fs.writeFileSync(path.join(screenshotDir, 'visual_audit_report.json'), JSON.stringify(reportJson, null, 2));
  console.log(`[✓] Relatório salvo em: ${path.join(screenshotDir, 'visual_audit_report.json')}`);
}

runVisualAudit().catch((err) => {
  console.error('Falha na execução da auditoria visual:', err);
  process.exit(1);
});

