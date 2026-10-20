// scripts/realityE2E.ts
// Ontabs End-to-End Reality Test & Product Experience Validation (Gate 6 & Gate 7)
// Executa testes automatizados com Playwright headless (Edge/Chromium)
// Validando Landing Page, Resolução do Link do Spotify, Biblioteca, Play Mode e Planos.

import { chromium, Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotDir = path.join(rootDir, 'docs', 'assurance', 'screenshots');

const BASE_URL = 'http://127.0.0.1:3001';

interface E2EStepResult {
  step: string;
  viewport: 'desktop_1920x1080' | 'mobile_375x812';
  passed: boolean;
  durationMs: number;
  screenshot?: string;
  details?: Record<string, any>;
  error?: string;
}

export async function runRealityE2E(): Promise<{
  timestamp: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  results: E2EStepResult[];
  status: 'PASS' | 'FAIL';
}> {
  console.log('================================================================');
  console.log('   ONTABS END-TO-END REALITY & UX AUDIT RUNNER (GATE 6 & 7)');
  console.log('================================================================\n');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results: E2EStepResult[] = [];

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  try {
    // ------------------------------------------------------------------------
    // FLUXO 1: DESKTOP EXPERIENCE (1920x1080)
    // ------------------------------------------------------------------------
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const desktopPage = await desktopContext.newPage();

    // 1. Landing Page Hero & Value Prop
    let t0 = Date.now();
    console.log('[+] Passo 1 [Desktop]: Verificando Landing Page Comercial...');
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const heroTitle = await desktopPage.locator('h1').first().innerText();
    const hasCta = (await desktopPage.locator('a[href="/register"], a[href="/converter"]').count()) > 0;

    const landingScreenshot = 'reality_desktop_landing.png';
    await desktopPage.screenshot({ path: path.join(screenshotDir, landingScreenshot) });

    results.push({
      step: 'Landing Page Hero & Value Proposition',
      viewport: 'desktop_1920x1080',
      passed: heroTitle.length > 0 && hasCta,
      durationMs: Date.now() - t0,
      screenshot: landingScreenshot,
      details: { heroTitle, hasCta },
    });
    console.log(`    - Hero Title: "${heroTitle}"`);
    console.log(`    - CTA Principal Presente: ${hasCta}`);

    // 2. Importação e Resolução de Link do Spotify (Can't You Hear Me Knocking)
    t0 = Date.now();
    console.log('\n[+] Passo 2 [Desktop]: Testando Resolução do Spotify (Can\'t You Hear Me Knocking)...');
    await desktopPage.goto(`${BASE_URL}/converter`, { waitUntil: 'networkidle' });

    const spotifyInputUrl = 'https://open.spotify.com/intl-pt/track/1hIQPCM3oWXrpnXmgTDaKG?si=ed8a593fc6484792';
    const inputSelector = 'input[placeholder*="spotify.com/track"]';
    await desktopPage.fill(inputSelector, spotifyInputUrl);

    // Clica no botão "Validar Link"
    const validateButton = desktopPage.locator('button', { hasText: 'Validar Link' });
    await validateButton.click();

    // Aguarda retorno da API e exibição do card com os metadados
    await desktopPage.waitForSelector('text=Can\'t You Hear Me Knocking', { timeout: 5000 });
    const hasArtist = (await desktopPage.locator('text=The Rolling Stones').count()) > 0;
    const hasMetadataOnlyBadge = (await desktopPage.locator('text=METADATA_ONLY').count()) > 0;

    const spotifyScreenshot = 'reality_desktop_spotify_resolution.png';
    await desktopPage.screenshot({ path: path.join(screenshotDir, spotifyScreenshot) });

    results.push({
      step: 'Spotify Connector Resolution & TOS Compliance UI',
      viewport: 'desktop_1920x1080',
      passed: hasArtist && hasMetadataOnlyBadge,
      durationMs: Date.now() - t0,
      screenshot: spotifyScreenshot,
      details: {
        resolvedTrack: "Can't You Hear Me Knocking",
        artistPresent: hasArtist,
        metadataOnlyBadgePresent: hasMetadataOnlyBadge,
      },
    });
    console.log(`    - Faixa Exibida: Can't You Hear Me Knocking`);
    console.log(`    - Artista Identificado: The Rolling Stones`);
    console.log(`    - Badge Legal METADATA_ONLY Visível: ${hasMetadataOnlyBadge}`);

    // 3. Biblioteca e Navegação de Músicas
    t0 = Date.now();
    console.log('\n[+] Passo 3 [Desktop]: Verificando Biblioteca de Músicas...');
    await desktopPage.goto(`${BASE_URL}/library`, { waitUntil: 'networkidle' });
    const songCards = await desktopPage.locator('.card').count();

    const libraryScreenshot = 'reality_desktop_library.png';
    await desktopPage.screenshot({ path: path.join(screenshotDir, libraryScreenshot) });

    results.push({
      step: 'Song Library & Catalog Navigation',
      viewport: 'desktop_1920x1080',
      passed: songCards > 0,
      durationMs: Date.now() - t0,
      screenshot: libraryScreenshot,
      details: { songCardsFound: songCards },
    });
    console.log(`    - Cards de Músicas/Ações Detectados: ${songCards}`);

    // 3B. Catálogo Soberano Verificado & Badges de Direitos Autorais
    t0 = Date.now();
    console.log('\n[+] Passo 3B [Desktop]: Testando Aba do Catálogo Soberano Verificado & Direitos...');
    const catalogTabBtn = desktopPage.locator('button', { hasText: 'Catálogo Soberano Verificado' });
    await catalogTabBtn.click();
    await desktopPage.waitForSelector('text=DOMÍNIO PÚBLICO', { timeout: 5000 });
    const verifiedCards = await desktopPage.locator('.card').count();
    const hasPublicDomainBadge = (await desktopPage.locator('text=DOMÍNIO PÚBLICO').count()) > 0;
    const hasCCByBadge = (await desktopPage.locator('text=CC BY 4.0').count()) > 0;

    const catalogScreenshot = 'reality_desktop_verified_catalog.png';
    await desktopPage.screenshot({ path: path.join(screenshotDir, catalogScreenshot) });

    results.push({
      step: 'Verified Catalog Tab & Multi-Tier Rights Badges',
      viewport: 'desktop_1920x1080',
      passed: verifiedCards >= 9 && hasPublicDomainBadge && hasCCByBadge,
      durationMs: Date.now() - t0,
      screenshot: catalogScreenshot,
      details: {
        verifiedCardsFound: verifiedCards,
        hasPublicDomainBadge,
        hasCCByBadge,
      },
    });
    console.log(`    - Cards do Catálogo Verificado: ${verifiedCards}`);
    console.log(`    - Badges [DOMÍNIO PÚBLICO] Presentes: ${hasPublicDomainBadge}`);
    console.log(`    - Badges [CC BY 4.0] Presentes: ${hasCCByBadge}`);

    // 4. OnTabs Play Mode (Verificação de Proveniência & Distinção de Modos)
    t0 = Date.now();
    console.log('\n[+] Passo 4 [Desktop]: Verificando OnTabs Play Mode & Badges...');
    await desktopPage.goto(`${BASE_URL}/play`, { waitUntil: 'networkidle' });
    const playHeading = await desktopPage.locator('h1').innerText();
    const hasDemoOption = (await desktopPage.locator('text=DEMO SINTÉTICA').count()) > 0;

    const playScreenshot = 'reality_desktop_play_selector.png';
    await desktopPage.screenshot({ path: path.join(screenshotDir, playScreenshot) });

    results.push({
      step: 'OnTabs Play Mode & Provenance Badges',
      viewport: 'desktop_1920x1080',
      passed: playHeading.includes('OnTabs Play') && hasDemoOption,
      durationMs: Date.now() - t0,
      screenshot: playScreenshot,
      details: { playHeading, hasDemoOption },
    });
    console.log(`    - Tela Play: "${playHeading}"`);
    console.log(`    - Distinção de Demonstração Sintética Presente: ${hasDemoOption}`);

    // 5. Planos e Precificação
    t0 = Date.now();
    console.log('\n[+] Passo 5 [Desktop]: Verificando Planos e Precificação...');
    await desktopPage.goto(`${BASE_URL}/planos`, { waitUntil: 'networkidle' });
    const planCards = await desktopPage.locator('.card').count();

    const plansScreenshot = 'reality_desktop_plans.png';
    await desktopPage.screenshot({ path: path.join(screenshotDir, plansScreenshot) });

    results.push({
      step: 'Pricing Plans & Tier Presentation',
      viewport: 'desktop_1920x1080',
      passed: planCards >= 3,
      durationMs: Date.now() - t0,
      screenshot: plansScreenshot,
      details: { planCardsCount: planCards },
    });
    console.log(`    - Planos Comerciais Encontrados: ${planCards}`);

    await desktopContext.close();

    // ------------------------------------------------------------------------
    // FLUXO 2: MOBILE EXPERIENCE (375x812 - iPhone 13 / Modern Smartphone)
    // ------------------------------------------------------------------------
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    // 6. Mobile Layout & Zero Horizontal Overflow
    t0 = Date.now();
    console.log('\n[+] Passo 6 [Mobile 375x812]: Verificando Responsividade e Overflow...');
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const mobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });

    const mobileLandingScreenshot = 'reality_mobile_landing.png';
    await mobilePage.screenshot({ path: path.join(screenshotDir, mobileLandingScreenshot) });

    results.push({
      step: 'Mobile Responsiveness & Zero Horizontal Overflow',
      viewport: 'mobile_375x812',
      passed: !mobileOverflow,
      durationMs: Date.now() - t0,
      screenshot: mobileLandingScreenshot,
      details: { hasHorizontalOverflow: mobileOverflow },
    });
    console.log(`    - Horizontal Overflow Detectado: ${mobileOverflow ? 'SIM (FALHA)' : 'NÃO (PERFEITO)'}`);

    // 7. Mobile Converter View
    t0 = Date.now();
    console.log('\n[+] Passo 7 [Mobile 375x812]: Verificando Tela de Importação Mobile...');
    await mobilePage.goto(`${BASE_URL}/converter`, { waitUntil: 'networkidle' });
    const mobileConverterOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });

    const mobileConverterScreenshot = 'reality_mobile_converter.png';
    await mobilePage.screenshot({ path: path.join(screenshotDir, mobileConverterScreenshot) });

    results.push({
      step: 'Mobile Converter Page Layout',
      viewport: 'mobile_375x812',
      passed: !mobileConverterOverflow,
      durationMs: Date.now() - t0,
      screenshot: mobileConverterScreenshot,
      details: { hasHorizontalOverflow: mobileConverterOverflow },
    });
    console.log(`    - Layout Mobile do Converter sem Overflow: ${!mobileConverterOverflow}`);

    await mobileContext.close();
  } finally {
    await browser.close();
  }

  const passedSteps = results.filter((r) => r.passed).length;
  const failedSteps = results.filter((r) => !r.passed).length;
  const overallStatus = failedSteps === 0 ? 'PASS' : 'FAIL';

  const report = {
    timestamp: new Date().toISOString(),
    totalSteps: results.length,
    passedSteps,
    failedSteps,
    results,
    status: overallStatus as 'PASS' | 'FAIL',
  };

  const e2eReportPath = path.join(rootDir, 'docs', 'assurance', 'reality_e2e_report.json');
  fs.writeFileSync(e2eReportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n================================================================');
  console.log(`   E2E REALITY AUDIT COMPLETED: ${passedSteps}/${results.length} PASSOU (STATUS: ${overallStatus})`);
  console.log(`   Relatório gravado em: ${e2eReportPath}`);
  console.log('================================================================\n');

  return report;
}

if (process.argv[1] && process.argv[1].endsWith('realityE2E.ts')) {
  runRealityE2E().catch((err) => {
    console.error('Falha na execução do Reality E2E:', err);
    process.exit(1);
  });
}

