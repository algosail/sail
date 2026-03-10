#!/usr/bin/env node
// scripts/build-docs.js – Parses JSDoc from lib/*.js and generates docs/index.html
// Run: node scripts/build-docs.js

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Client-side JS is kept as a plain string to avoid template-literal
// interpolation conflicts with regex literals and object syntax.
const CLIENT_JS = `
// ── Search index ─────────────────────────────────────────────────────────────
// INDEX is injected below as a JSON literal

// ── DOM refs ──────────────────────────────────────────────────────────────────
const searchEl    = document.getElementById('search')
const clearBtn    = document.getElementById('search-clear')
const resultsEl   = document.getElementById('search-results')
const noResults   = document.getElementById('no-results')
const sidebar     = document.getElementById('sidebar')
const allEntries  = Array.from(document.querySelectorAll('.entry'))
const allSections = Array.from(document.querySelectorAll('.module'))
const allTocFns   = Array.from(document.querySelectorAll('.toc-fn'))
const allTocMods  = Array.from(document.querySelectorAll('.toc-module-link'))

// ── HTML escape ────────────────────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// ── Highlight match ───────────────────────────────────────────────────────────
function highlight(text, query) {
  if (!query) return escHtml(text)
  const escaped = query.replace(new RegExp('[-.*+?^$' + '{}()|[\\\\]\\\\\\\\]', 'g'), '\\\\$&')
  const re = new RegExp('(' + escaped + ')', 'gi')
  return escHtml(text).replace(re, '<mark>$1</mark>')
}

// ── Inline search (filter entries in-place) ───────────────────────────────────
let activeQuery = ''

function applyFilter(q) {
  activeQuery = q.trim().toLowerCase()
  clearBtn.style.display = activeQuery ? 'block' : 'none'

  let anyVisible = false

  allEntries.forEach(function(el) {
    const name   = el.dataset.name.toLowerCase()
    const module = el.dataset.module.toLowerCase()
    const match  = !activeQuery || name.includes(activeQuery) || module.includes(activeQuery)
    el.classList.toggle('search-hidden', !match)
    el.classList.toggle('search-match', !!(activeQuery && match))
    if (match) anyVisible = true
  })

  allSections.forEach(function(sec) {
    const hasVisible = Array.from(sec.querySelectorAll('.entry')).some(
      function(e) { return !e.classList.contains('search-hidden') }
    )
    sec.style.display = hasVisible ? '' : 'none'
  })

  noResults.style.display = (!anyVisible && activeQuery) ? 'block' : 'none'
}

// ── Dropdown search ───────────────────────────────────────────────────────────
let focusedIdx = -1

function renderDropdown(q) {
  if (!q) { closeDropdown(); return }

  const ql      = q.toLowerCase()
  const matches = INDEX.filter(function(item) {
    return item.name.toLowerCase().includes(ql) ||
           item.module.toLowerCase().includes(ql) ||
           (item.sig && item.sig.toLowerCase().includes(ql))
  }).slice(0, 12)

  if (!matches.length) {
    resultsEl.innerHTML = '<div class="sr-empty">No results</div>'
    resultsEl.classList.add('visible')
    focusedIdx = -1
    return
  }

  resultsEl.innerHTML = matches.map(function(item, i) {
    const nameHtml = highlight(item.name, q)
    const badge    = '<span class="sr-badge">' + escHtml(item.module) + '</span>'
    const sig      = item.sig ? '<div class="sr-sig">' + escHtml(item.sig) + '</div>' : ''
    return '<a class="sr-item" href="#' + item.id + '" data-idx="' + i + '">' +
             '<div class="sr-name">' + nameHtml + badge + '</div>' +
             sig +
           '</a>'
  }).join('')

  resultsEl.classList.add('visible')
  focusedIdx = -1

  resultsEl.querySelectorAll('.sr-item').forEach(function(el) {
    el.addEventListener('click', function() {
      closeDropdown()
      searchEl.value = ''
      clearBtn.style.display = 'none'
      applyFilter('')
    })
  })
}

function closeDropdown() {
  resultsEl.classList.remove('visible')
  focusedIdx = -1
}

function moveFocus(dir) {
  const items = Array.from(resultsEl.querySelectorAll('.sr-item'))
  if (!items.length) return
  items.forEach(function(el) { el.classList.remove('focused') })
  focusedIdx = (focusedIdx + dir + items.length) % items.length
  items[focusedIdx].classList.add('focused')
  items[focusedIdx].scrollIntoView({ block: 'nearest' })
}

// ── Event listeners ───────────────────────────────────────────────────────────
searchEl.addEventListener('input', function(e) {
  const q = e.target.value
  renderDropdown(q)
  applyFilter(q)
})

searchEl.addEventListener('keydown', function(e) {
  if (!resultsEl.classList.contains('visible')) return
  if (e.key === 'ArrowDown')  { e.preventDefault(); moveFocus(+1) }
  if (e.key === 'ArrowUp')    { e.preventDefault(); moveFocus(-1) }
  if (e.key === 'Enter') {
    const items = resultsEl.querySelectorAll('.sr-item')
    if (focusedIdx >= 0 && items[focusedIdx]) items[focusedIdx].click()
    closeDropdown()
  }
  if (e.key === 'Escape') { closeDropdown() }
})

searchEl.addEventListener('focus', function() {
  if (searchEl.value) renderDropdown(searchEl.value)
})

document.addEventListener('click', function(e) {
  if (!searchEl.contains(e.target) && !resultsEl.contains(e.target)) {
    closeDropdown()
  }
})

clearBtn.addEventListener('click', function() {
  searchEl.value = ''
  clearBtn.style.display = 'none'
  applyFilter('')
  closeDropdown()
  searchEl.focus()
})

// ── Active TOC highlighting via IntersectionObserver ──────────────────────────
const tocFnMap  = {}
const tocModMap = {}

allTocFns.forEach(function(a)  { tocFnMap[a.getAttribute('href').slice(1)]  = a })
allTocMods.forEach(function(a) { tocModMap[a.getAttribute('href').slice(1)] = a })

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (!entry.isIntersecting) return
    const id  = entry.target.id
    const mod = entry.target.dataset.module || entry.target.id.replace('module-', '')

    allTocFns.forEach(function(a)  { a.classList.remove('active') })
    allTocMods.forEach(function(a) { a.classList.remove('active') })

    if (tocFnMap[id])                   tocFnMap[id].classList.add('active')
    if (tocModMap['module-' + mod])     tocModMap['module-' + mod].classList.add('active')

    const activeFn = tocFnMap[id]
    if (activeFn) {
      const sb = sidebar.getBoundingClientRect()
      const el = activeFn.getBoundingClientRect()
      if (el.top < sb.top + 32 || el.bottom > sb.bottom - 32) {
        activeFn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  })
}, { rootMargin: '-52px 0px -60% 0px', threshold: 0 })

allEntries.forEach(function(el)  { observer.observe(el) })
allSections.forEach(function(el) { observer.observe(el) })

// ── Keyboard shortcut: / to focus search ──────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === '/' && document.activeElement !== searchEl) {
    e.preventDefault()
    searchEl.focus()
    searchEl.select()
  }
})
`

const __dirname = dirname (fileURLToPath (import.meta.url))
const ROOT      = join (__dirname, '..')
const LIB_DIR   = join (ROOT, 'lib')
const OUT_FILE  = join (ROOT, 'docs', 'index.html')

// =============================================================================
// Module metadata — display name, description, order
// =============================================================================

const MODULE_META = {
  fn:         { label: 'fn',         title: 'Function',     desc: 'Core combinators, composition, Reader monad, and error handling.' },
  logic:      { label: 'logic',      title: 'Logic',        desc: 'Predicate combinators and control-flow utilities.' },
  maybe:      { label: 'maybe',      title: 'Maybe',        desc: 'The Maybe monad — Just | Nothing. Represents optional values.' },
  either:     { label: 'either',     title: 'Either',       desc: 'The Either monad — Left | Right. Represents values with two possibilities.' },
  validation: { label: 'validation', title: 'Validation',   desc: 'Applicative error accumulation — Failure | Success.' },
  these:      { label: 'these',      title: 'These',        desc: 'The These type — This | That | Both. Holds one or both values.' },
  ordering:   { label: 'ordering',   title: 'Ordering',     desc: 'The Ordering type — LT | EQ | GT. Comparator algebra.' },
  identity:   { label: 'identity',   title: 'Identity',     desc: 'The Identity functor / monad. The simplest possible wrapper.' },
  state:      { label: 'state',      title: 'State',        desc: 'The State monad. Stateful computations as pure functions.' },
  lens:       { label: 'lens',       title: 'Lens',         desc: 'Functional lenses for immutable data access and update.' },
  array:      { label: 'array',      title: 'Array',        desc: 'Array utilities: constructors, folds, and transformers.' },
  nonempty:   { label: 'nonempty',   title: 'NonEmpty',     desc: 'NonEmptyArray — an array guaranteed to have at least one element.' },
  pair:       { label: 'pair',       title: 'Pair',         desc: 'Ordered pair (2-tuple) utilities.' },
  strmap:     { label: 'strmap',     title: 'StrMap',       desc: 'Plain JS objects used as string-keyed maps.' },
  boolean:    { label: 'boolean',    title: 'Boolean',      desc: 'Boolean type guard and equality.' },
  number:     { label: 'number',     title: 'Number',       desc: 'Number predicates, arithmetic, and safe parsing.' },
  string:     { label: 'string',     title: 'String',       desc: 'String comparison, manipulation, and utility functions.' },
  date:       { label: 'date',       title: 'Date',         desc: 'Immutable date constructors, comparison, and arithmetic.' },
  regexp:     { label: 'regexp',     title: 'RegExp',       desc: 'RegExp constructors, comparison, and matching utilities.' },
  nil:        { label: 'nil',        title: 'Nil',          desc: 'Utilities for null | undefined values.' },
  map:        { label: 'map',        title: 'Map',          desc: 'Functional Map with arbitrary key types. Immutable, equality-function-based.' },
  set:        { label: 'set',        title: 'Set',          desc: 'Functional Set with arbitrary equality. Immutable, equality-function-based.' },
}

const MODULE_ORDER = Object.keys (MODULE_META)

// =============================================================================
// JSDoc parser
// =============================================================================

function parseFile (filePath) {
  const src     = readFileSync (filePath, 'utf8')
  const entries = []

  // Match every /** ... */ block followed by an export
  const blockRe = /\/\*\*([\s\S]*?)\*\/\s*\nexport\s+(function\s+(\w+)|const\s+(\w+))/g
  let m

  while ((m = blockRe.exec (src)) !== null) {
    const raw    = m[1]
    const name   = m[3] || m[4]
    const parsed = parseJsDocBlock (raw, name)
    if (parsed) entries.push (parsed)
  }

  return entries
}

function parseJsDocBlock (raw, name) {
  // Strip leading " * " from each line
  const lines = raw
    .split ('\n')
    .map  ((l) => l.replace (/^\s*\*\s?/, '').trimEnd ())

  let description = ''
  let signature   = ''
  const examples  = []
  let inExample   = false
  let exBuf       = []

  for (const line of lines) {
    if (line.startsWith ('@example')) {
      inExample = true
      exBuf     = []
      continue
    }

    if (line.startsWith ('@')) {
      // other tags — flush example if open
      if (inExample && exBuf.length) {
        examples.push (exBuf.join ('\n').trim ())
        inExample = false
        exBuf     = []
      }
      continue
    }

    if (inExample) {
      // First non-empty comment line inside @example that looks like a type sig
      if (exBuf.length === 0 && line.trim ().startsWith ('//')) {
        // "// name :: Type" — extract as signature if we haven't yet
        const sigMatch = line.match (/\/\/\s*\w+\s*::(.+)/)
        if (sigMatch && !signature) {
          signature = `${name} ::${sigMatch[1].trimEnd ()}`
        }
        exBuf.push (line)
      } else {
        exBuf.push (line)
      }
    } else {
      // Description lines (before any @tag)
      if (line.trim () !== '' || description !== '') {
        description += (description ? '\n' : '') + line
      }
    }
  }

  // Flush last example
  if (inExample && exBuf.length) {
    examples.push (exBuf.join ('\n').trim ())
  }

  description = description.trim ()

  return { name, signature, description, examples }
}

// =============================================================================
// Load all modules
// =============================================================================

function loadModules () {
  const files   = readdirSync (LIB_DIR).filter ((f) => f.endsWith ('.js'))
  const modules = []

  for (const order of MODULE_ORDER) {
    const file = `${order}.js`
    if (!files.includes (file)) continue
    const meta    = MODULE_META[order]
    const entries = parseFile (join (LIB_DIR, file))
    if (entries.length === 0) continue
    modules.push ({ ...meta, entries })
  }

  return modules
}

// =============================================================================
// HTML escape
// =============================================================================

function esc (s) {
  return s
    .replace (/&/g, '&amp;')
    .replace (/</g, '&lt;')
    .replace (/>/g, '&gt;')
    .replace (/"/g, '&quot;')
}

// =============================================================================
// Render example lines:
//   "// ..." lines  → dim comment
//   "// => ..."     → result annotation
//   other           → code
// =============================================================================

function renderExample (ex) {
  const lines = ex.split ('\n')
  const html  = lines.map ((raw) => {
    const l = raw.trim ()
    if (l.startsWith ('// =>')) {
      return `<span class="ex-result">${esc (raw)}</span>`
    }
    if (l.startsWith ('//')) {
      return `<span class="ex-comment">${esc (raw)}</span>`
    }
    return `<span class="ex-code">${esc (raw)}</span>`
  })
  return `<pre class="example"><code>${html.join ('\n')}</code></pre>`
}

// =============================================================================
// Render one function entry
// =============================================================================

function renderEntry (e, moduleLabel) {
  const id      = `${moduleLabel}-${e.name}`
  const sigHtml = e.signature
    ? `<div class="sig"><code>${esc (e.signature)}</code></div>`
    : ''
  const descHtml = e.description
    ? `<p class="desc">${esc (e.description).replace (/\n/g, '<br>')}</p>`
    : ''
  const exHtml = e.examples.map (renderExample).join ('')

  return `
      <div class="entry" id="${id}" data-name="${esc (e.name)}" data-module="${esc (moduleLabel)}">
        <div class="entry-header">
          <a class="entry-anchor" href="#${id}">
            <h3 class="entry-name">${esc (e.name)}</h3>
          </a>
          <span class="entry-module-badge">${esc (moduleLabel)}</span>
        </div>
        ${sigHtml}
        ${descHtml}
        ${exHtml}
      </div>`
}

// =============================================================================
// Render one module section
// =============================================================================

function renderModule (mod) {
  const entriesHtml = mod.entries.map ((e) => renderEntry (e, mod.label)).join ('')
  return `
    <section class="module" id="module-${mod.label}">
      <div class="module-header">
        <h2 class="module-title">${esc (mod.title)}</h2>
        <p class="module-desc">${esc (mod.desc)}</p>
      </div>
      <div class="entries">${entriesHtml}
      </div>
    </section>`
}

// =============================================================================
// TOC
// =============================================================================

function renderToc (modules) {
  const items = modules.map ((mod) => {
    const fnLinks = mod.entries.map ((e) =>
      `<li><a class="toc-fn" href="#${mod.label}-${e.name}">${esc (e.name)}</a></li>`,
    ).join ('')
    return `
        <li class="toc-module-item">
          <a class="toc-module-link" href="#module-${mod.label}">${esc (mod.title)}</a>
          <ul class="toc-fns">${fnLinks}</ul>
        </li>`
  }).join ('')
  return `<ul class="toc-modules">${items}</ul>`
}

// =============================================================================
// Full page
// =============================================================================

function buildPage (modules) {
  const toc          = renderToc (modules)
  const sectionsHtml = modules.map (renderModule).join ('')

  // Build flat JSON index for search: [{name, module, id, sig, desc}]
  const index = []
  for (const mod of modules) {
    for (const e of mod.entries) {
      index.push ({
        id:     mod.label + '-' + e.name,
        name:   e.name,
        module: mod.label,
        title:  mod.title,
        sig:    e.signature,
        desc:   e.description.replace (/\n/g, ' ').slice (0, 120),
      })
    }
  }
  const indexJson   = JSON.stringify (index)
  const totalFns    = modules.reduce ((n, m) => n + m.entries.length, 0)
  const inlineScript = 'const INDEX = ' + indexJson + ';\n' + CLIENT_JS

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@algosail/sail — API Documentation</title>
  <style>
    /* ── Reset & base ─────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }

    :root {
      --bg:          #0f1117;
      --bg2:         #171b24;
      --bg3:         #1e2330;
      --border:      #2a3040;
      --accent:      #5b8ef0;
      --accent-dim:  #3d6bc7;
      --text:        #d4d9e8;
      --text-dim:    #7a8399;
      --text-muted:  #4a5268;
      --green:       #4ec994;
      --orange:      #e8924a;
      --purple:      #a78bfa;
      --yellow:      #f0c060;
      --red:         #e06c75;
      --font-mono:   'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
      --font-sans:   'Inter', system-ui, -apple-system, sans-serif;
      --sidebar-w:   280px;
      --content-max: 860px;
      --radius:      6px;
    }

    html { scroll-behavior: smooth }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 15px;
      line-height: 1.65;
      display: flex;
      min-height: 100vh;
    }

    a { color: var(--accent); text-decoration: none }
    a:hover { text-decoration: underline }

    /* ── Top bar ───────────────────────────────────────────────────────── */
    .topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 20px;
      z-index: 100;
    }

    .topbar-logo {
      font-family: var(--font-mono);
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .topbar-logo span { color: var(--accent); }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 480px;
    }

    #search {
      width: 100%;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 13px;
      padding: 7px 12px 7px 34px;
      outline: none;
      transition: border-color .15s;
    }
    #search::placeholder { color: var(--text-muted) }
    #search:focus { border-color: var(--accent) }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
      font-size: 14px;
    }

    #search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      display: none;
      padding: 2px 4px;
    }
    #search-clear:hover { color: var(--text) }

    .topbar-version {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    /* ── Search results dropdown ───────────────────────────────────────── */
    #search-results {
      position: absolute;
      top: calc(100% + 6px);
      left: 0; right: 0;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      max-height: 420px;
      overflow-y: auto;
      display: none;
      z-index: 200;
      box-shadow: 0 8px 32px rgba(0,0,0,.5);
    }
    #search-results.visible { display: block }

    .sr-item {
      display: block;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background .1s;
    }
    .sr-item:last-child { border-bottom: none }
    .sr-item:hover, .sr-item.focused { background: var(--bg3) }

    .sr-name {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text);
      font-weight: 600;
    }
    .sr-name mark {
      background: none;
      color: var(--accent);
      font-weight: 700;
    }
    .sr-badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 10px;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 5px;
      color: var(--text-dim);
      margin-left: 6px;
      vertical-align: middle;
    }
    .sr-sig {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sr-empty {
      padding: 16px;
      color: var(--text-muted);
      font-size: 13px;
      text-align: center;
    }

    /* ── Sidebar ───────────────────────────────────────────────────────── */
    .sidebar {
      position: fixed;
      top: 52px;
      left: 0;
      bottom: 0;
      width: var(--sidebar-w);
      background: var(--bg2);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      padding: 16px 0 32px;
      z-index: 50;
    }

    .sidebar::-webkit-scrollbar { width: 4px }
    .sidebar::-webkit-scrollbar-track { background: transparent }
    .sidebar::-webkit-scrollbar-thumb { background: var(--border) }

    .toc-modules { list-style: none }

    .toc-module-item { margin-bottom: 4px }

    .toc-module-link {
      display: block;
      padding: 5px 18px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--text-dim);
      transition: color .15s;
    }
    .toc-module-link:hover { color: var(--text); text-decoration: none }
    .toc-module-link.active { color: var(--accent) }

    .toc-fns { list-style: none; margin-bottom: 6px }

    .toc-fn {
      display: block;
      padding: 2px 18px 2px 28px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color .15s;
    }
    .toc-fn:hover { color: var(--text); text-decoration: none }
    .toc-fn.active { color: var(--accent) }

    /* ── Main content ──────────────────────────────────────────────────── */
    .main {
      margin-left: var(--sidebar-w);
      margin-top: 52px;
      padding: 48px 48px 96px;
      width: 100%;
      max-width: calc(var(--sidebar-w) + var(--content-max) + 96px);
    }

    /* ── Hero ──────────────────────────────────────────────────────────── */
    .hero {
      margin-bottom: 56px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--border);
    }

    .hero h1 {
      font-family: var(--font-mono);
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 10px;
    }
    .hero h1 span { color: var(--accent) }

    .hero p {
      color: var(--text-dim);
      font-size: 15px;
      max-width: 600px;
      line-height: 1.7;
    }

    .hero-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-family: var(--font-mono);
      background: var(--bg3);
      border: 1px solid var(--border);
      color: var(--text-dim);
    }
    .pill-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
    }

    /* ── Module section ────────────────────────────────────────────────── */
    .module {
      margin-bottom: 64px;
      scroll-margin-top: 68px;
    }

    .module-header {
      margin-bottom: 24px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }

    .module-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }

    .module-desc {
      color: var(--text-dim);
      font-size: 13px;
    }

    /* ── Entry ─────────────────────────────────────────────────────────── */
    .entry {
      margin-bottom: 36px;
      padding: 20px 22px;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      scroll-margin-top: 68px;
      transition: border-color .2s;
    }
    .entry:hover { border-color: #3a4560 }
    .entry.search-hidden { display: none }
    .entry.search-match { border-color: var(--accent-dim) }

    .entry-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .entry-anchor { flex: 1 }
    .entry-anchor:hover { text-decoration: none }

    .entry-name {
      font-family: var(--font-mono);
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      display: inline;
    }
    .entry-anchor:hover .entry-name { color: var(--accent) }

    .entry-module-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 3px;
      background: var(--bg3);
      border: 1px solid var(--border);
      color: var(--text-muted);
      flex-shrink: 0;
    }

    /* ── Signature ─────────────────────────────────────────────────────── */
    .sig {
      background: var(--bg3);
      border-left: 3px solid var(--accent);
      border-radius: 0 var(--radius) var(--radius) 0;
      padding: 8px 12px;
      margin-bottom: 12px;
      overflow-x: auto;
    }

    .sig code {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--purple);
      white-space: pre;
    }

    /* ── Description ───────────────────────────────────────────────────── */
    .desc {
      font-size: 14px;
      color: var(--text-dim);
      line-height: 1.7;
      margin-bottom: 12px;
    }

    /* ── Example block ─────────────────────────────────────────────────── */
    .example {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 14px;
      overflow-x: auto;
      margin-top: 10px;
    }

    .example code {
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.75;
      display: block;
    }

    .ex-comment { color: var(--text-muted) }
    .ex-result  { color: var(--green) }
    .ex-code    { color: var(--text) }

    /* ── No-results overlay ────────────────────────────────────────────── */
    #no-results {
      display: none;
      padding: 48px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 15px;
    }

    /* ── Scrollbar ─────────────────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; height: 6px }
    ::-webkit-scrollbar-track { background: transparent }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px }

    /* ── Responsive ────────────────────────────────────────────────────── */
    @media (max-width: 720px) {
      .sidebar { display: none }
      .main { margin-left: 0; padding: 24px 20px 64px }
      .topbar-version { display: none }
    }
  </style>
</head>
<body>

<!-- ── Top bar ──────────────────────────────────────────────────────────── -->
<header class="topbar">
  <div class="topbar-logo">@algosail/<span>sail</span></div>

  <div class="search-wrap">
    <span class="search-icon">⌕</span>
    <input id="search" type="search" placeholder="Search functions…" autocomplete="off" spellcheck="false">
    <button id="search-clear" title="Clear search">✕</button>
    <div id="search-results"></div>
  </div>

  <div class="topbar-version">v0.1.2</div>
</header>

<!-- ── Sidebar ──────────────────────────────────────────────────────────── -->
<nav class="sidebar" id="sidebar">
  ${toc}
</nav>

<!-- ── Main ─────────────────────────────────────────────────────────────── -->
<main class="main" id="main">

  <div class="hero">
    <h1>@algosail/<span>sail</span></h1>
    <p>A small functional programming library for vanilla JavaScript.
       Curried functions, algebraic data types, and zero dependencies.</p>
    <div class="hero-pills">
      <span class="pill"><span class="pill-dot"></span>Fully curried</span>
      <span class="pill"><span class="pill-dot"></span>Zero dependencies</span>
      <span class="pill"><span class="pill-dot"></span>ESM only</span>
      <span class="pill"><span class="pill-dot"></span>` + totalFns + ` functions</span>
      <span class="pill"><span class="pill-dot"></span>` + modules.length + ` modules</span>
    </div>
  </div>

  <div id="no-results">No functions match your search.</div>

  ${sectionsHtml}
</main>

<script>
` + inlineScript + `
</script>
</body>
</html>`
}

// =============================================================================
// Main
// =============================================================================

const modules  = loadModules ()
const html     = buildPage (modules)
writeFileSync (OUT_FILE, html, 'utf8')

const totalFns = modules.reduce ((n, m) => n + m.entries.length, 0)
console.log ('✓ Generated docs/index.html')
console.log ('  ' + modules.length + ' modules, ' + totalFns + ' functions')
