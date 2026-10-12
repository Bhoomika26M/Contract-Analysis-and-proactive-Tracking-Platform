/**
 * Browser test of the real UI flow:
 * React -> FastAPI -> SQLite -> FastAPI -> React
 *
 * Drives the actual page (no API shortcuts) with puppeteer-core.
 * There is no authentication: the app opens straight on the tracker.
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join as joinPath } from 'node:path'

const APP = 'http://127.0.0.1:8443'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const DOWNLOADS = 'C:\\Users\\CHRISM~1\\AppData\\Local\\Temp\\opencode\\downloads'

let passed = 0
let failed = 0
const failures = []
const consoleErrors = []

const listFiles = dir => {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

function check(label, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    failures.push(label)
    console.log(`  FAIL  ${label} ${detail}`)
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const bodyText = () => document.body.innerText
const countOf = selector => `document.querySelectorAll(${JSON.stringify(selector)}).length`

async function waitFor(page, fn, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await page.evaluate(fn)) return true
    await sleep(250)
  }
  return false
}

async function clickText(page, tag, text, label) {
  const ok = await page.evaluate((t, tx) => {
    const el = [...document.querySelectorAll(t)].find(e => e.textContent.trim() === tx)
    if (!el) return false
    el.click()
    return true
  }, tag, text)
  check(`can click "${text}"${label ? ` (${label})` : ''}`, ok)
  await sleep(700)
  return ok
}

async function clickModalButton(page, text) {
  const ok = await page.evaluate(tx => {
    const modals = [...document.querySelectorAll('.fixed.inset-0.z-50')]
    const modal = modals[modals.length - 1]
    if (!modal) return false
    const btn = [...modal.querySelectorAll('button')].find(
      b => b.textContent.trim() === tx || b.textContent.includes(tx),
    )
    if (!btn) return false
    btn.click()
    return true
  }, text)
  check(`can click modal button "${text}"`, ok)
  await sleep(900)
  return ok
}

async function setModalField(page, labelText, value) {
  return page.evaluate((lt, val) => {
    const modals = [...document.querySelectorAll('.fixed.inset-0.z-50')]
    const modal = modals[modals.length - 1]
    if (!modal) return false
    const label = [...modal.querySelectorAll('label > span')].find(s => s.textContent.trim() === lt)
    const field = label?.parentElement?.querySelector('input, textarea, select')
    if (!field) return false
    const proto = field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : field instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(field, val)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }, labelText, value)
}

async function expandSidebar(page) {
  await page.evaluate(() => document.querySelector('[title="Expand sidebar"]')?.click())
  await sleep(700)
}

/** Switches the obligation tracker between kanban (0), list (1) and calendar (2). */
const VIEW_ICONS = ['lucide-layout-grid', 'lucide-list', 'lucide-calendar']

async function switchView(page, index) {
  const ok = await page.evaluate(cls => {
    const svg = document.querySelector(`svg.${cls}`)
    const btn = svg?.closest('button')
    btn?.click()
    return Boolean(btn)
  }, VIEW_ICONS[index])
  await sleep(1300)
  return ok
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    userDataDir: 'C:\\Users\\CHRISM~1\\AppData\\Local\\Temp\\opencode\\chrome-profile',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  })
  const page = await browser.newPage()
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`))

  try {
    console.log('\n[0] Load the app')
    await page.goto(APP, { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(1500)

    let body = await page.evaluate(bodyText)
    check('lands on the obligation tracker', body.includes('Obligation Tracker'), body.slice(0, 200))
    check('no login screen', !body.includes('Sign in'))
    await expandSidebar(page)
    body = await page.evaluate(bodyText)
    check('sidebar shows only the two modules',
      body.includes('Renewals') && !body.includes('Contracts') &&
      !body.includes('Compliance') && !body.includes('Reports') &&
      !body.includes('Audit Logs') && !body.includes('User Management'),
      body.slice(0, 400))

    console.log('\n[2] Empty state')
    check('obligations report no data', body.includes('No data available'), body.slice(0, 300))
    check('stat cards render zero', body.includes('Total') && body.includes('Overdue'))

    console.log('\n[3] Create an obligation')
    await clickText(page, 'button', 'Add Obligation')
    check('modal opens', (await page.evaluate(bodyText)).includes('Obligation Title'))
    await setModalField(page, 'Obligation Title', 'Annual SOC 2 evidence submission')
    await setModalField(page, 'Contract', 'Northwind Analytics MSA')
    await setModalField(page, 'Owner', 'Sarah Mitchell')
    await setModalField(page, 'Priority', 'critical')
    await setModalField(page, 'Status', 'todo')
    await setModalField(page, 'Due Date', '2026-10-20')
    await setModalField(page, 'Department', 'Technology')
    await setModalField(page, 'Completion (%)', '0')
    await sleep(300)
    await clickModalButton(page, 'Add Obligation')
    check('obligation created via API',
      await waitFor(page, () => document.body.innerText.includes('Obligation added')))
    await sleep(900)
    body = await page.evaluate(bodyText)
    check('obligation appears in the kanban', body.includes('Annual SOC 2 evidence submission'), body.slice(0, 400))
    check('kanban shows the contract from the database', body.includes('Northwind Analytics MSA'))
    check('kanban shows the owner from the database', body.includes('Sarah'), body.slice(0, 400))
    check('Critical badge rendered', body.includes('Critical'))
    check('stat total updated from the API', body.includes('0/1 completed'), body.slice(0, 300))

    console.log('\n[4] Second obligation, overdue detection')
    await clickText(page, 'button', 'Add Obligation')
    await setModalField(page, 'Obligation Title', 'Quarterly invoice reconciliation')
    await setModalField(page, 'Contract', 'Northwind Analytics MSA')
    await setModalField(page, 'Owner', 'Sarah Mitchell')
    await setModalField(page, 'Priority', 'high')
    await setModalField(page, 'Status', 'in-progress')
    await setModalField(page, 'Due Date', '2026-09-15')
    await sleep(300)
    await clickModalButton(page, 'Add Obligation')
    await waitFor(page, () => document.body.innerText.includes('Obligation added'))
    await sleep(900)
    body = await page.evaluate(bodyText)
    check('second obligation listed', body.includes('Quarterly invoice reconciliation'))
    check('overdue count comes from the API', body.includes('1 overdue'), body.slice(0, 300))

    console.log('\n[5] List view + detail drawer')
    const views = await switchView(page, 1)
    body = await page.evaluate(bodyText)
    check('list view toggle rendered', views, String(views))
    check('list view table rendered', (await page.evaluate(countOf('tbody tr'))) === 2,
      String(await page.evaluate(countOf('tbody tr'))))
    check('list view shows both contract names',
      body.includes('Northwind Analytics MSA') && body.includes('In Progress'))

    await clickContainingText(page, 'td', 'Annual SOC 2 evidence submission')
    await sleep(1200)
    body = await page.evaluate(bodyText)
    check('detail drawer opens', body.includes('Task Details'), body.slice(0, 300))
    check('drawer shows the stored due date', body.includes('Oct 20, 2026'), body.slice(0, 400))
    await clickText(page, 'button', 'Mark Complete')
    await sleep(1800)
    body = await page.evaluate(bodyText)
    check('mark complete persists via API', body.includes('Done'), body.slice(0, 400))
    check('completed count updated', body.includes('1/2 completed'), body.slice(0, 300))
    // Close the detail drawer so it does not shadow the export modal.
    await page.evaluate(() => {
      const modals = [...document.querySelectorAll('.fixed.inset-0.z-50')]
      const drawer = modals[modals.length - 1]
      drawer?.querySelector('svg.lucide-x')?.closest('button')?.click()
    })
    await sleep(900)
    check('detail drawer closed', !(await page.evaluate(bodyText)).includes('Task Details'))

    console.log('\n[6] Export the live rows')
    mkdirSync(DOWNLOADS, { recursive: true })
    const cdp = await page.createCDPSession()
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS })
    await clickText(page, 'button', 'Export')
    check('export modal opens',
      await waitFor(page, () => document.body.innerText.includes('Obligation Tracker Export')))
    check('export reports the real row count',
      (await page.evaluate(bodyText)).includes('2 row(s)'))
    await clickModalButton(page, 'Export CSV')
    await sleep(2500)
    const csvFiles = listFiles(DOWNLOADS).filter(f => f.endsWith('.csv'))
    check('CSV downloaded', csvFiles.length > 0, listFiles(DOWNLOADS).join(','))
    if (csvFiles.length) {
      const csv = readFileSync(joinPath(DOWNLOADS, csvFiles[0]), 'utf8')
      check('CSV header matches the column definitions', csv.includes('Obligation,Contract,Owner'), csv.slice(0, 140))
      check('CSV holds the real rows',
        csv.includes('Annual SOC 2 evidence submission') &&
        csv.includes('Quarterly invoice reconciliation'))
      check('CSV has no placeholder data',
        !csv.includes('Acme Corp') && !csv.includes('Sample') && !csv.includes('Lorem'))
    }

    console.log('\n[7] Renewals — empty state then create')
    await expandSidebar(page)
    await clickText(page, 'button', 'Renewals')
    await sleep(2000)
    body = await page.evaluate(bodyText)
    check('renewals report no data', body.includes('No data available'), body.slice(0, 300))
    check('renewal tabs present',
      body.includes('All Renewals') && body.includes('Calendar') && body.includes('Details'))

    await clickText(page, 'button', 'New Renewal')
    check('new renewal modal opens', (await page.evaluate(bodyText)).includes('New Renewal'))
    await setModalField(page, 'Contract name', 'Northwind Analytics MSA')
    await setModalField(page, 'Counterparty', 'Northwind Analytics Ltd')
    await setModalField(page, 'Department', 'Technology')
    await setModalField(page, 'Current expiry', '2026-10-20')
    await setModalField(page, 'Renewal date', '2026-10-05')
    await setModalField(page, 'Renewal value', '533500')
    await setModalField(page, 'Approval status', 'pending')
    await sleep(300)
    await clickModalButton(page, 'Create renewal')
    check('renewal created via API',
      await waitFor(page, () => document.body.innerText.includes('Renewal created')))
    await sleep(1200)
    body = await page.evaluate(bodyText)
    check('renewal no longer empty', !body.includes('No data available'), body.slice(0, 300))
    check('renewal pipeline value rendered', body.includes('$533,500'), body.slice(0, 400))
    check('monthly chart heading present', body.includes('Upcoming Renewal Value by Month'))
    check('same-week renewal appears under Requires Immediate Attention',
      body.includes('Requires Immediate Attention') && body.includes('Northwind Analytics MSA'), body.slice(0, 500))
    check('renewal counted in the Due in 7 days card', body.includes('1') && body.includes('Due in 7 days'))

    console.log('\n[8] Renewals — table, calendar, details')
    await clickText(page, 'button', 'All Renewals')
    await sleep(1500)
    check('renewal row shows the contract', (await page.evaluate(bodyText)).includes('Northwind Analytics MSA'))
    check('renewal value in the table', (await page.evaluate(bodyText)).includes('$533,500'))
    check('approval status in the table', (await page.evaluate(bodyText)).includes('Pending'))
    check('exactly one renewal row', (await page.evaluate(countOf('tbody tr'))) === 1)

    await clickText(page, 'button', 'Calendar')
    await sleep(1200)
    check('calendar renders a year', /\d{4}/.test(await page.evaluate(bodyText)))
    check('calendar legend present', (await page.evaluate(bodyText)).includes('Urgent (≤7d)'))

    await clickText(page, 'button', 'Details')
    await sleep(1500)
    body = await page.evaluate(bodyText)
    check('details render from the database', body.includes('$533,500') && body.includes('Northwind Analytics MSA'), body.slice(0, 400))
    check('approval controls present', body.includes('Approval Status'))

    console.log('\n[9] Renewals — edit approval, reminder, delete')
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Approved')
      btn?.click()
    })
    await sleep(2000)
    check('approval persisted through the API',
      (await page.evaluate(bodyText)).includes('Approval set to Approved'), (await page.evaluate(bodyText)).slice(0, 300))

    await expandSidebar(page)
    await clickText(page, 'button', 'Renewals')
    await clickText(page, 'button', 'Overview')
    await sleep(1200)
    await clickText(page, 'button', 'Set Reminders')
    await sleep(1000)
    check('reminder dialog opens', (await page.evaluate(bodyText)).includes('Set Renewal Reminder'))
    await clickModalButton(page, 'Set Reminder')
    check('reminder saved', await waitFor(page, () => document.body.innerText.includes('Reminder saved')))

    await clickText(page, 'button', 'All Renewals')
    await sleep(1500)
    await page.evaluate(() => {
      const row = document.querySelector('tbody tr')
      const btns = [...row.querySelectorAll('button')]
      btns[0].click()
    })
    await sleep(1200)
    check('renew dialog opens', (await page.evaluate(bodyText)).includes('Renew Contract'))
    await clickModalButton(page, 'Delete renewal record')
    check('renewal deleted', await waitFor(page, () => document.body.innerText.includes('Renewal deleted')))
    await sleep(1200)
    check('renewals return to the empty state',
      (await page.evaluate(bodyText)).includes('No data available'))

    console.log('\n[10] Obligation delete')
    await expandSidebar(page)
    await clickText(page, 'button', 'Obligation Tracker')
    await sleep(1500)
    await switchView(page, 1) // list view, where rows are clickable table cells
    await sleep(1200)
    check('list view active for deletion', (await page.evaluate(countOf('tbody tr'))) === 2,
      String(await page.evaluate(countOf('tbody tr'))))
    for (const title of ['Annual SOC 2 evidence submission', 'Quarterly invoice reconciliation']) {
      await clickContainingText(page, 'td', title)
      await sleep(1200)
      await clickText(page, 'button', 'Delete obligation')
      await sleep(2000)
    }
    check('obligations empty after deletes',
      (await page.evaluate(bodyText)).includes('No data available'), (await page.evaluate(bodyText)).slice(0, 300))

    console.log('\n[11] Theme + profile')
    await page.evaluate(() => {
      ;[...document.querySelectorAll('button')].find(b => b.title?.includes('dark mode'))?.click()
    })
    await sleep(600)
    const darkBg = await page.evaluate(
      () => getComputedStyle(document.querySelector('.h-screen')).backgroundColor,
    )
    check('theme toggle works', darkBg === 'rgb(18, 18, 18)', darkBg)

    await page.evaluate(() => {
      ;[...document.querySelectorAll('button')].find(b => b.title?.includes('light mode'))?.click()
    })
    await sleep(500)
    await expandSidebar(page)
    await page.evaluate(() => {
      ;[...document.querySelectorAll('button')].find(b => b.textContent.includes('ContractIQ User'))?.click()
    })
    await sleep(900)
    check('profile dropdown shows the local user',
      (await page.evaluate(bodyText)).includes('user@contractiq.local'))
    check('no sign out option', !(await page.evaluate(bodyText)).includes('Sign Out'))

    console.log('\n[12] Console hygiene')
    const realErrors = consoleErrors.filter(
      e => !e.includes('Failed to load resource') && !e.includes('favicon'),
    )
    check('no uncaught errors in the browser console', realErrors.length === 0,
      realErrors.slice(0, 2).join(' | '))
  } finally {
    await browser.close()
  }

  console.log(`\n${'='.repeat(52)}\n  ${passed} passed, ${failed} failed`)
  if (failures.length) console.log(`  failing: ${failures.join(', ')}`)
  console.log('='.repeat(52))
  process.exit(failed ? 1 : 0)
}

async function clickContainingText(page, tag, text) {
  const ok = await page.evaluate((t, tx) => {
    const el = [...document.querySelectorAll(t)].find(e => e.textContent.includes(tx))
    if (!el) return false
    el.click()
    return true
  }, tag, text)
  check(`can click row containing "${text}"`, ok)
  await sleep(900)
  return ok
}

main().catch(err => {
  console.error('browser test crashed:', err)
  process.exit(1)
})