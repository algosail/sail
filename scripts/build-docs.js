#!/usr/bin/env node
// scripts/build-docs.js – Parses JSDoc from lib/*.js and generates docs/index.html
// Run: node scripts/build-docs.js

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Client-side JS is kept as a plain string to avoid template-literal
// interpolation conflicts with regex literals and object syntax.
const CLIENT_JS = `
`

const __dirname = dirname (fileURLToPath (import.meta.url))
const ROOT      = join (__dirname, '..')
const LIB_DIR   = join (ROOT, 'lib')
const OUT_FILE  = join (ROOT, 'docs', 'index.html')

// =============================================================================
// Module metadata — display name, description, order
// =============================================================================

const MODULE_META = {
  fn:             { label: 'fn',           title: 'Function',     desc: 'Core combinators, composition, Reader monad, and error handling.' },
  logic:          { label: 'logic',        title: 'Logic',        desc: 'Predicate combinators and control-flow utilities.' },
  maybe:          { label: 'maybe',        title: 'Maybe',        desc: 'The Maybe monad — Just | Nothing. Represents optional values.' },
  either:         { label: 'either',       title: 'Either',       desc: 'The Either monad — Left | Right. Represents values with two possibilities.' },
  validation:     { label: 'validation',   title: 'Validation',   desc: 'Applicative error accumulation — Failure | Success.' },
  these:          { label: 'these',        title: 'These',        desc: 'The These type — This | That | Both. Holds one or both values.' },
  ordering:       { label: 'ordering',     title: 'Ordering',     desc: 'The Ordering type — LT | EQ | GT. Comparator algebra.' },
  identity:       { label: 'identity',     title: 'Identity',     desc: 'The Identity functor / monad. The simplest possible wrapper.' },
  state:          { label: 'state',        title: 'State',        desc: 'The State monad. Stateful computations as pure functions.' },
  'state-either': { label: 'state-either', title: 'StateEither',  desc: 'The StateEither monad. Stateful computations with error handling.' },
  lens:           { label: 'lens',         title: 'Lens',         desc: 'Functional lenses for immutable data access and update.' },
  array:          { label: 'array',        title: 'Array',        desc: 'Array utilities: constructors, folds, and transformers.' },
  nonempty:       { label: 'nonempty',     title: 'NonEmpty',     desc: 'NonEmptyArray — an array guaranteed to have at least one element.' },
  pair:           { label: 'pair',         title: 'Pair',         desc: 'Ordered pair (2-tuple) utilities.' },
  strmap:         { label: 'strmap',       title: 'StrMap',       desc: 'Plain JS objects used as string-keyed maps.' },
  boolean:        { label: 'boolean',      title: 'Boolean',      desc: 'Boolean type guard and equality.' },
  number:         { label: 'number',       title: 'Number',       desc: 'Number predicates, arithmetic, and safe parsing.' },
  string:         { label: 'string',       title: 'String',       desc: 'String comparison, manipulation, and utility functions.' },
  date:           { label: 'date',         title: 'Date',         desc: 'Immutable date constructors, comparison, and arithmetic.' },
  regexp:         { label: 'regexp',       title: 'RegExp',       desc: 'RegExp constructors, comparison, and matching utilities.' },
  nil:            { label: 'nil',          title: 'Nil',          desc: 'Utilities for null | undefined values.' },
  map:            { label: 'map',          title: 'Map',          desc: 'Functional Map with arbitrary key types. Immutable, equality-function-based.' },
  set:            { label: 'set',          title: 'Set',          desc: 'Functional Set with arbitrary equality. Immutable, equality-function-based.' },
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
  const html  = lines.map ((raw, i) => {
    if (i === 0) return ''
    const l = raw.trim ()
    if (l.startsWith ('// =>')) {
      return `<span class="ex-result">${esc (raw)}</span>`
    }
    if (l.startsWith ('//')) {
      return `<span class="ex-comment">${esc (raw)}</span>`
    }
    return `<span class="ex-code">${esc (raw)}</span>`
  }).filter (Boolean)
  return `<pre class="example"><code>${html.join ('\n')}</code></pre>`
}

// =============================================================================
// Render one function entry
// =============================================================================

function renderEntry (e, moduleLabel) {
  const id      = `${moduleLabel}-${e.name}`

  const sigContent = esc (e.signature)
    .split ('::')
    .map ((it, i) => i === 0 ? `<span class="sig-name">${it}</span>` : `<span class="sig-type">::${it}</span>`)
    .join ('')

  const sigHtml = e.signature
    ? `<h3 class="sig"><code>${sigContent}</code></h3>`
    : ''
  const descHtml = e.description
    ? `<p class="desc">${esc (e.description).replace (/\n/g, '<br>')}</p>`
    : ''
  const exHtml = e.examples.map (renderExample).join ('')

  return `
      <div class="entry" id="${id}" data-name="${esc (e.name)}" data-module="${esc (moduleLabel)}">
        <a class="entry-anchor" href="#${id}">
          ${sigHtml}
        </a>
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
      `<li><a class="toc-fn" href="#${mod.label}-${e.name}">${esc (e.signature)}</a></li>`,
    ).join ('')
    return `
        <details id="module-${mod.label}" class="toc-module-item">
          <summary class="toc-module-link">${esc (mod.title)}</summary>
          <ul class="toc-fns">${fnLinks}</ul>
        </details>`
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
  <link rel="stylesheet" href="./styles.css">
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


<!-- ── Main ─────────────────────────────────────────────────────────────── -->
<main class="main" id="main">

  <div class="hero">
    <div class="hero-content">
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
    ${toc}
  </div>

  <div id="no-results">No functions match your search.</div>

  ${sectionsHtml}
</main>

<script>
  const INDEX = ${indexJson};
</script>
<script src="./script.js" type="module"></script>
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
