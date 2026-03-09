#!/usr/bin/env node
// scripts/build-docs.js
// Generates README.md for every lib/*.js file from its JSDoc comments.
//
// JSDoc shape expected:
//   /**
//    * Human-readable description.
//    * @example
//    * // name :: Type -> Type
//    * name (arg) // => result
//    */
//   export function name (...) { ... }
//   export const name = ...

import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'fs'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath (new URL ('.', import.meta.url))
const LIB = join (__dirname, '..', 'lib')

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Extracts JSDoc blocks paired with the name of the symbol they annotate.
 * Returns Array<{ name, description, signature, examples }>.
 */
function parseFile (src) {
  const entries = []

  // Match each /** ... */ block + the first non-empty code line after it
  const blockRe = /\/\*\*([\s\S]*?)\*\/\s*\n([ \t]*(?:export\s+)?(?:function|const|class)\s+(\w+)[\s\S]*?)(?=\n\s*\n|\n\/\*\*|$)/g

  let m
  while ((m = blockRe.exec (src)) !== null) {
    const rawComment = m[1]
    const name = m[3]
    if (!name) continue

    // Strip leading " * " from each JSDoc line
    const lines = rawComment
      .split ('\n')
      .map ((l) => l.replace (/^\s*\*\s?/, '').trimEnd ())
      .filter ((l, i, a) => !(i === 0 && l === '') && !(i === a.length - 1 && l === ''))

    const descLines = []
    const exampleLines = []
    let inExample = false

    for (const line of lines) {
      if (line.startsWith ('@example')) {
        inExample = true
        continue
      }
      if (line.startsWith ('@') && !inExample) continue
      if (inExample) {
        exampleLines.push (line)
      } else {
        descLines.push (line)
      }
    }

    // First example line starting with "// name ::" is the type signature
    let signature = null
    const filteredExamples = []

    for (const line of exampleLines) {
      const sigMatch = line.match (/^\/\/\s*\S+\s*::(.+)/)
      if (!signature && sigMatch) {
        signature = `${name} ::${sigMatch[1].trimEnd ()}`
      } else {
        filteredExamples.push (line)
      }
    }

    entries.push ({
      name,
      description: descLines.join (' ').trim (),
      signature,
      examples: filteredExamples,
    })
  }

  return entries
}

// ── Renderer ──────────────────────────────────────────────────────────────────

function renderEntry (entry) {
  const parts = []

  parts.push (`### \`${entry.name}\``)
  parts.push ('')

  if (entry.signature) {
    parts.push ('```')
    parts.push (entry.signature)
    parts.push ('```')
    parts.push ('')
  }

  if (entry.description) {
    parts.push (entry.description)
    parts.push ('')
  }

  if (entry.examples.length > 0) {
    parts.push ('```js')
    for (const line of entry.examples) parts.push (line)
    parts.push ('```')
    parts.push ('')
  }

  return parts.join ('\n')
}

function renderReadme (moduleName, entries) {
  const lines = []
  lines.push (`# \`${moduleName}\``)
  lines.push ('')
  lines.push ('| Function | Signature |')
  lines.push ('|---|---|')

  for (const e of entries) {
    const sig = e.signature
      ? e.signature.replace (/\|/g, '\\|')
      : ''
    lines.push (`| [\`${e.name}\`](#${e.name.toLowerCase ()}) | \`${sig}\` |`)
  }

  lines.push ('')
  lines.push ('---')
  lines.push ('')

  for (const e of entries) {
    lines.push (renderEntry (e))
    lines.push ('---')
    lines.push ('')
  }

  return lines.join ('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────

const pkg = JSON.parse (readFileSync (join (__dirname, '..', 'package.json'), 'utf8'))
const files = readdirSync (LIB)
  .filter ((f) => f.endsWith ('.js'))
  .sort ()

// Collect all modules
const modules = []
for (const file of files) {
  const filePath = join (LIB, file)
  const src = readFileSync (filePath, 'utf8')
  const entries = parseFile (src)
  if (entries.length === 0) continue
  modules.push ({ name: basename (file, '.js'), entries })
}

// ── Render single README ───────────────────────────────────────────────────────

const out = []

out.push (`# ${pkg.name}`)
out.push ('')
out.push (pkg.description)
out.push ('')

// Top-level module TOC
out.push ('## Modules')
out.push ('')
for (const mod of modules) {
  out.push (`- [\`${mod.name}\`](#${mod.name})`)
}
out.push ('')
out.push ('---')
out.push ('')

// Each module section
for (const mod of modules) {
  out.push (`## \`${mod.name}\``)
  out.push ('')

  // Per-module function table
  out.push ('| Function | Signature |')
  out.push ('|---|---|')
  for (const e of mod.entries) {
    const sig = e.signature ? e.signature.replace (/\|/g, '\\|') : ''
    const anchor = `${mod.name}-${e.name.toLowerCase ()}`
    out.push (`| [\`${e.name}\`](#${anchor}) | \`${sig}\` |`)
  }
  out.push ('')

  // Each function entry
  for (const e of mod.entries) {
    const anchor = `${mod.name}-${e.name.toLowerCase ()}`
    out.push (`### \`${e.name}\` {#${anchor}}`)
    out.push ('')
    if (e.signature) {
      out.push ('```')
      out.push (e.signature)
      out.push ('```')
      out.push ('')
    }
    if (e.description) {
      out.push (e.description)
      out.push ('')
    }
    if (e.examples.length > 0) {
      out.push ('```js')
      for (const line of e.examples) out.push (line)
      out.push ('```')
      out.push ('')
    }
    out.push ('---')
    out.push ('')
  }
}

const outPath = join (__dirname, '..', 'README.md')
writeFileSync (outPath, out.join ('\n'))
console.log (`✓  README.md  (${modules.length} modules, ${modules.reduce ((n, m) => n + m.entries.length, 0)} entries)`)

// Remove per-module .md files if they exist
for (const mod of modules) {
  const p = join (LIB, `${mod.name}.md`)
  if (existsSync (p)) {
    unlinkSync (p)
    console.log (`  removed ${mod.name}.md`)
  }
}
