// Run against the Vite server in mock mode; all records live in an isolated browser context.
const path = require('node:path')
const fs = require('node:fs')
const assert = require('node:assert/strict')
const auditTools =
  process.env.PROVISA_AUDIT_TOOLS || path.resolve('node_modules')
const { chromium } = require(path.join(auditTools, 'playwright-core'))
const out = path.resolve(
  process.env.PROVISA_AUDIT_OUT || 'deliverables/ui-audit',
)
const baseUrl = process.env.PROVISA_AUDIT_URL || 'http://127.0.0.1:1420/'
fs.mkdirSync(path.join(out, 'after'), { recursive: true })
;(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PROVISA_CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    })
    const page = await context.newPage()
    const errors = [],
      results = [],
      audits = [],
      controlContrasts = []
    page.on('pageerror', (e) => errors.push(String(e)))
    async function snap(name, audit = true) {
      await page.waitForTimeout(250)
      await page.screenshot({
        path: `${out}/after/${name}.png`,
        fullPage: true,
      })
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `overflow ${name}`,
      )
      if (audit) {
        await page.addScriptTag({
          path: path.join(auditTools, 'axe-core/axe.min.js'),
        })
        const r = await page.evaluate(() =>
          axe.run(document, {
            runOnly: {
              type: 'tag',
              values: [
                'wcag2a',
                'wcag2aa',
                'wcag21a',
                'wcag21aa',
                'best-practice',
              ],
            },
          }),
        )
        audits.push({ name, ...r })
        fs.writeFileSync(
          `${out}/accessibility.json`,
          JSON.stringify(audits, null, 2),
        )
        console.log(
          'AXE',
          name,
          r.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
        )
      }
    }
    async function stageSizes(name) {
      for (const [width, height] of [
        [1024, 768],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
      ]) {
        await page.setViewportSize({ width, height })
        await snap(`${name}-${width}`)
        const controls = await page
          .locator(
            'input:not([type="hidden"]):not(:disabled), select:not(:disabled), [role="checkbox"]:not(:disabled), [role="radio"]:not(:disabled)',
          )
          .evaluateAll((elements) => {
            function luminance(rgb) {
              return rgb
                .map((value) => {
                  const channel = value / 255
                  return channel <= 0.04045
                    ? channel / 12.92
                    : ((channel + 0.055) / 1.055) ** 2.4
                })
                .reduce(
                  (sum, value, index) =>
                    sum + value * [0.2126, 0.7152, 0.0722][index],
                  0,
                )
            }
            function color(value) {
              return value
                .match(/[\d.]+/g)
                .slice(0, 3)
                .map(Number)
            }
            return elements
              .filter((element) => {
                const rect = element.getBoundingClientRect()
                return rect.width > 2 && rect.height > 2
              })
              .map((element) => {
                const style = getComputedStyle(element),
                  border = luminance(color(style.borderTopColor)),
                  background = luminance(color(style.backgroundColor))
                return {
                  label:
                    element.getAttribute('aria-label') ||
                    element.id ||
                    element.getAttribute('role'),
                  border: style.borderTopColor,
                  background: style.backgroundColor,
                  contrast:
                    (Math.max(border, background) + 0.05) /
                    (Math.min(border, background) + 0.05),
                }
              })
          })
        controlContrasts.push({ name, width, controls })
        fs.writeFileSync(
          `${out}/control-contrast.json`,
          JSON.stringify(controlContrasts, null, 2),
        )
        assert.equal(
          controls.filter((control) => control.contrast < 3).length,
          0,
          `Form control boundary contrast below 3:1 in ${name} at ${width}`,
        )
        const footer = page.locator('.workflow-footer')
        await footer.scrollIntoViewIfNeeded()
        assert.equal(
          await footer.evaluate((el) => getComputedStyle(el).position),
          'static',
        )
      }
      await page.setViewportSize({ width: 1440, height: 900 })
      results.push(
        `${name}: screenshot, accessibility and footer checks at all four required sizes`,
      )
    }
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    assert.equal(
      await page.evaluate(async () => {
        const { RUNTIME_CONFIG } = await import('/src/lib/config.ts')
        return RUNTIME_CONFIG.mockMode
      }),
      true,
      'Start Vite with VITE_MOCK_MODE=true before running the UI audit.',
    )
    await snap('home-empty')
    for (const [label, name] of [
      ['Historique', 'history-empty'],
      ['Demandes expirées', 'expired-empty'],
      ['Statistiques', 'statistics-empty'],
    ]) {
      await page
        .locator('.nav-items')
        .getByRole('button', { name: new RegExp('^' + label) })
        .click()
      await snap(name)
    }
    await page
      .locator('.nav-items')
      .getByRole('button', { name: /^Nouvelle demande/ })
      .click()
    await page.getByRole('dialog', { name: 'Votre profil' }).waitFor()
    await snap('profile')
    await page
      .getByRole('button', { name: 'Enregistrer', exact: true })
      .click()
    assert.equal(
      await page
        .getByRole('textbox', { name: 'Nom complet' })
        .evaluate((el) => el === document.activeElement),
      true,
    )
    await snap('profile-validation')
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      assert.equal(
        await page.evaluate(() =>
          document
            .querySelector('.profile-dialog')
            .contains(document.activeElement),
        ),
        true,
      )
    }
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    await page.getByRole('button', { name: /Configurer mon profil/ }).click()
    await page
      .getByRole('textbox', { name: 'Nom complet' })
      .fill('Opérateur de contrôle')
    await page
      .getByRole('textbox', { name: 'Adresse e-mail' })
      .fill('controle@example.test')
    await page
      .getByRole('button', { name: 'Enregistrer', exact: true })
      .click()
    await page.waitForTimeout(600)
    await snap('configuration')
    await stageSizes('configuration')
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    assert.equal(
      await page
        .locator('[aria-current="step"]')
        .innerText()
        .then((s) => s.includes('Configuration')),
      true,
    )
    results.push('Invalid configuration blocks continuation')
    await page.getByRole('checkbox', { name: /conditions/ }).check()
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await page
      .getByRole('heading', { name: 'Voyageur 1', exact: true })
      .waitFor()
    await snap('travellers-empty')
    // Seed a valid two-traveller fixture in a disposable browser context, through the existing persisted schema.
    await page.evaluate(async () => {
      const { createEmptyBookingDraft, createEmptyTraveller } =
        await import('/src/lib/state/defaults.ts')
      const { useBookingStore } = await import('/src/lib/state/store.ts')
      const draft = createEmptyBookingDraft()
      draft.area = 'capago_ANB'
      draft.formula = 'standard'
      draft.cgv = true
      draft.nbTravellers = 2
      draft.optionalServices.relation = 'no_relation'
      draft.travellers = [0, 1].map((i) => ({
        ...createEmptyTraveller(i),
        title: 'mr',
        firstname: i ? 'Karim' : 'Amine',
        lastname: 'Test',
        dayBirth: '01',
        monthBirth: '01',
        yearBirth: '1990',
        phone: '0555123456',
        email: 'controle@example.test',
        emailConfirm: 'controle@example.test',
        passportNumber: i ? 'AB123457' : 'AB123456',
        visaStayDuration: 'short_stay',
        travelPurpose: 'tourism',
        typeVisa: 'anb_short_tourism_single',
        precision1: 'single_entry',
        precision2: 'tourism_standard',
        visaFileVariation: 'primo_demand',
      }))
      useBookingStore.setState({ draft, currentStep: 2, completedSteps: [1] })
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page
      .locator('.nav-items')
      .getByRole('button', { name: /^Nouvelle demande/ })
      .click()
    await page.getByRole('tab', { name: /Amine/ }).waitFor()
    await snap('travellers')
    await stageSizes('travellers')
    await page.getByRole('tab', { name: /Amine/ }).focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(
      await page
        .getByRole('tab', { name: /Karim/ })
        .getAttribute('aria-selected'),
      'true',
    )
    await page
      .getByRole('textbox', { name: 'Nom', exact: true })
      .fill('Valeur conservée')
    await page.getByRole('tab', { name: /Amine/ }).click()
    await page.getByRole('tab', { name: /Karim/ }).click()
    assert.equal(
      await page
        .getByRole('textbox', { name: 'Nom', exact: true })
        .inputValue(),
      'Valeur conservée',
    )
    results.push('Traveller arrow-key switching and field preservation')
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await page.getByRole('heading', { name: 'Services du dossier' }).waitFor()
    await snap('services')
    await stageSizes('services')
    await page
      .getByRole('radio', {
        name: /pas.*assurance|Non.*assurance|sans.*assurance/i,
      })
      .count()
      .then(async (count) => {
        if (count)
          await page
            .getByRole('radio', {
              name: /pas.*assurance|Non.*assurance|sans.*assurance/i,
            })
            .first()
            .click()
      })
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await page
      .getByRole('heading', { name: 'Rendez-vous et vérification' })
      .waitFor()
    await page.waitForTimeout(700)
    await snap('appointment')
    await stageSizes('appointment')
    const account = page
      .locator('.workspace-utility')
      .getByRole('button', { name: 'Opérateur de contrôle' })
    await account.click()
    await page
      .getByRole('textbox', { name: 'Nom complet' })
      .fill('Brouillon de profil')
    await page.keyboard.press('Escape')
    assert.equal(
      await account.evaluate((el) => el === document.activeElement),
      true,
    )
    await account.click()
    assert.equal(
      await page.getByRole('textbox', { name: 'Nom complet' }).inputValue(),
      'Brouillon de profil',
    )
    await page
      .getByRole('textbox', { name: 'Nom complet' })
      .fill('Opérateur de contrôle')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    results.push(
      'Profile keyboard focus stays inside the dialog, validation focuses its error, Escape restores the trigger, unsaved edits survive reopening',
    )
    // Verify disclosure, export contents and cancellation before destructive reset.
    await page.locator('.data-menu > summary').click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exporter JSON' }).click(),
    ])
    await download.saveAs(`${out}/exported-draft.json`)
    const exported = JSON.parse(fs.readFileSync(`${out}/exported-draft.json`))
    assert.equal(exported.values.travellers[1].lastname, 'Valeur conservée')
    results.push('JSON export preserves both travellers')
    await page
      .getByRole('button', { name: 'Réinitialiser', exact: true })
      .click()
    await page.getByRole('dialog').waitFor()
    await snap('reset-confirmation')
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    results.push('Reset dialog Escape cancels without deleting draft')
    // Seed records only in this temporary browser profile, never in production or source fixtures.
    await page.evaluate(async () => {
      const { useBookingStore } = await import('/src/lib/state/store.ts')
      const values = useBookingStore.getState().draft
      const { buildStoredRequestRecord } =
        await import('/src/lib/request-records.ts')
      const records = Array.from({ length: 12 }, (_, i) => {
        const record = buildStoredRequestRecord({
          values,
          payload: { encoded: 'test', fields: {} },
          result: { status: 201, location: null },
          centerLabel: 'Annaba',
          submitter: {
            name: 'Opérateur de contrôle',
            email: 'controle@example.test',
          },
        })
        return {
          ...record,
          id: `browser-test-${i}`,
          primaryTravellerName: `Dossier de contrôle ${i + 1}`,
          submittedAt: new Date(Date.now() - i * 6 * 86400000).toISOString(),
        }
      })
      localStorage.setItem(
        'damander-visa-request-records',
        JSON.stringify(records),
      )
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page
      .locator('.nav-items')
      .getByRole('button', { name: /^Nouvelle demande/ })
      .click()
    for (const name of [
      'Accueil',
      'Historique',
      'Demandes expirées',
      'Statistiques',
      'Messagerie',
      'Assistance',
    ]) {
      await page
        .locator('.nav-items')
        .getByRole('button', { name: new RegExp('^' + name) })
        .click()
      await snap(
        name === 'Accueil'
          ? 'home'
          : name === 'Historique'
            ? 'history'
            : name === 'Demandes expirées'
              ? 'expired'
              : name === 'Statistiques'
                ? 'statistics'
                : name === 'Messagerie'
                  ? 'mail'
                  : 'support',
      )
    }
    await page
      .locator('.nav-items')
      .getByRole('button', { name: 'Accueil', exact: true })
      .click()
    await page
      .getByRole('textbox', { name: 'Rechercher mes demandes' })
      .fill('aucun-resultat')
    assert.equal(await page.getByRole('article').count(), 0)
    await page.getByText('Aucun dossier trouvé').waitFor()
    await page.getByRole('button', { name: 'Effacer la recherche' }).click()
    await page.getByRole('button', { name: /^À renouveler/ }).click()
    assert.equal(
      await page
        .getByRole('button', { name: /^À renouveler/ })
        .getAttribute('aria-pressed'),
      'true',
    )
    await page.getByRole('button', { name: 'Afficher en liste' }).click()
    await snap('home-list')
    const originalDraft = await page.evaluate(() =>
      localStorage.getItem('damander-visa-desktop-store'),
    )
    await page
      .getByRole('button', { name: /^Consulter le dossier/ })
      .first()
      .click()
    await page.getByRole('dialog').waitFor()
    await snap('home-details')
    await page.keyboard.press('Escape')
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem('damander-visa-desktop-store'),
      ),
      originalDraft,
    )
    await page.getByRole('button', { name: /^Toutes les demandes/ }).click()
    await page.getByRole('button', { name: 'Afficher en grille' }).click()
    results.push(
      'Home search, expiration filter, list/grid switching and read-only detail view preserve the current draft',
    )
    await page.getByRole('button', { name: /^Historique/ }).click()
    await page
      .getByRole('textbox', { name: 'Recherche dans les demandes' })
      .fill('aucun-resultat')
    await snap('history-no-results')
    await page
      .getByRole('textbox', { name: 'Recherche dans les demandes' })
      .fill('')
    await page
      .getByRole('button', { name: 'Détails', exact: true })
      .first()
      .click()
    await snap('request-details')
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    results.push('History search and details Escape')
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1280, 800],
      [1024, 768],
    ]) {
      await page.setViewportSize({ width, height })
      for (const name of [
        'Accueil',
        'Nouvelle demande',
        'Historique',
        'Demandes expirées',
        'Statistiques',
        'Messagerie',
        'Assistance',
      ]) {
        await page
          .locator('.nav-items')
          .getByRole('button', { name: new RegExp('^' + name) })
          .click()
        await snap(`${width}-${name.split(' ')[0]}`, false)
      }
    }
    results.push(
      'All seven navigation pages have no horizontal document overflow at four target sizes',
    )
    await page.setViewportSize({ width: 1440, height: 900 })
    await page
      .locator('.nav-items')
      .getByRole('button', { name: /^Nouvelle demande/ })
      .click()
    await page.locator('.data-menu > summary').click()
    await page
      .getByRole('button', { name: 'Réinitialiser', exact: true })
      .click()
    await page
      .getByRole('button', {
        name: 'Réinitialiser le brouillon',
        exact: true,
      })
      .click()
    assert.equal(
      await page.getByRole('checkbox', { name: /conditions/ }).isChecked(),
      false,
    )
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('damander-visa-request-records'))
            .length,
      ),
      12,
    )
    results.push(
      'Confirmed reset clears current draft and preserves all 12 history records',
    )
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Importer JSON' }).click(),
    ])
    await chooser.setFiles(`${out}/exported-draft.json`)
    await page.waitForTimeout(800)
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('damander-visa-desktop-store'))
            .state.draft.travellers[1].lastname,
      ),
      'Valeur conservée',
    )
    results.push('Exported JSON reimports through the real file picker')
    // Existing queue fixture; no production verification token is synthesized.
    await page.evaluate(async () => {
      const { useBookingStore } = await import('/src/lib/state/store.ts')
      useBookingStore.setState((state) => ({
        draft: { ...state.draft, area: 'capago_CZL', formula: 'premium' },
        currentStep: 4,
        completedSteps: [1, 2, 3],
      }))
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page
      .locator('.nav-items')
      .getByRole('button', { name: /^Nouvelle demande/ })
      .click()
    await page.getByText('Inscription en file d’attente').waitFor()
    await snap('appointment-queue')
    const savedRecords = await page.evaluate(() =>
      localStorage.getItem('damander-visa-request-records'),
    )
    await page.evaluate(() =>
      localStorage.setItem(
        'damander-visa-request-records',
        'invalid-test-json',
      ),
    )
    await page.reload({ waitUntil: 'networkidle' })
    await page
      .getByRole('heading', { name: 'Vos dossiers ne sont pas disponibles' })
      .waitFor()
    for (const name of ['Historique', 'Demandes expirées', 'Statistiques']) {
      await page
        .locator('.nav-items')
        .getByRole('button', { name, exact: true })
        .click()
      await snap(`records-error-${name}`)
      assert.equal(
        await page
          .getByText('Dossiers indisponibles', { exact: true })
          .count(),
        1,
      )
    }
    await page.evaluate(
      (value) => localStorage.setItem('damander-visa-request-records', value),
      savedRecords,
    )
    await page.getByRole('button', { name: 'Réessayer', exact: true }).click()
    await page.getByText('Répartition par centre', { exact: true }).waitFor()
    await snap('statistics-retry')
    assert.equal(
      await page
        .getByRole('heading', {
          name: 'Vos dossiers ne sont pas disponibles',
        })
        .count(),
      0,
    )
    results.push(
      'Unreadable records show an honest error on history, expired and statistics; retry recovers real data without changing stored records',
    )
    fs.writeFileSync(
      `${out}/accessibility.json`,
      JSON.stringify(audits, null, 2),
    )
    fs.writeFileSync(
      `${out}/browser-results.json`,
      JSON.stringify({ results, errors }, null, 2),
    )
    assert.equal(errors.length, 0)
    assert.equal(
      audits.reduce((count, audit) => count + audit.violations.length, 0),
      0,
      'Accessibility violations were reported; inspect accessibility.json',
    )
    console.log('PASSED', results)
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
