// ── Search index ─────────────────────────────────────────────────────────────
// INDEX is injected below as a JSON literal

// ── DOM refs ──────────────────────────────────────────────────────────────────
const searchEl    = document.getElementById ('search')
const clearBtn    = document.getElementById ('search-clear')
const resultsEl   = document.getElementById ('search-results')
const noResults   = document.getElementById ('no-results')
const sidebar     = document.getElementById ('sidebar')
const allEntries  = Array.from (document.querySelectorAll ('.entry'))
const allSections = Array.from (document.querySelectorAll ('.module'))
const allTocFns   = Array.from (document.querySelectorAll ('.toc-fn'))
const allTocMods  = Array.from (document.querySelectorAll ('.toc-module-link'))

// ── HTML escape ────────────────────────────────────────────────────────────────
function escHtml (s) {
  return s.replace (/&/g, '&amp;').replace (/</g, '&lt;').replace (/>/g, '&gt;')
}

// ── Highlight match ───────────────────────────────────────────────────────────
function highlight (text, query) {
  if (!query) return escHtml (text)
  const escaped = query.replace (new RegExp ('[-.*+?^$' + '{}()|[\\\\]\\\\\\\\]', 'g'), '\\\\$&')
  const re = new RegExp ('(' + escaped + ')', 'gi')
  return escHtml (text).replace (re, '<mark>$1</mark>')
}

// ── Inline search (filter entries in-place) ───────────────────────────────────
let activeQuery = ''

function applyFilter (q) {
  activeQuery = q.trim ().toLowerCase ()
  clearBtn.style.display = activeQuery ? 'block' : 'none'

  let anyVisible = false

  allEntries.forEach (function (el) {
    const name   = el.dataset.name.toLowerCase ()
    const module = el.dataset.module.toLowerCase ()
    const match  = !activeQuery || name.includes (activeQuery) || module.includes (activeQuery)
    el.classList.toggle ('search-hidden', !match)
    el.classList.toggle ('search-match', !!(activeQuery && match))
    if (match) anyVisible = true
  })

  allSections.forEach (function (sec) {
    const hasVisible = Array.from (sec.querySelectorAll ('.entry')).some (
      function (e) { return !e.classList.contains ('search-hidden') },
    )
    sec.style.display = hasVisible ? '' : 'none'
  })

  noResults.style.display = (!anyVisible && activeQuery) ? 'block' : 'none'
}

// ── Dropdown search ───────────────────────────────────────────────────────────
let focusedIdx = -1

function renderDropdown (q) {
  if (!q) { closeDropdown (); return }

  const ql      = q.toLowerCase ()
  const matches = INDEX.filter (function (item) {
    return item.name.toLowerCase ().includes (ql) ||
           item.module.toLowerCase ().includes (ql) ||
           (item.sig && item.sig.toLowerCase ().includes (ql))
  }).slice (0, 12)

  if (!matches.length) {
    resultsEl.innerHTML = '<div class="sr-empty">No results</div>'
    resultsEl.classList.add ('visible')
    focusedIdx = -1
    return
  }

  resultsEl.innerHTML = matches.map (function (item, i) {
    const nameHtml = highlight (item.name, q)
    const badge    = '<span class="sr-badge">' + escHtml (item.module) + '</span>'
    const sig      = item.sig ? '<div class="sr-sig">' + escHtml (item.sig) + '</div>' : ''
    return '<a class="sr-item" href="#' + item.id + '" data-idx="' + i + '">' +
             '<div class="sr-name">' + nameHtml + badge + '</div>' +
             sig +
           '</a>'
  }).join ('')

  resultsEl.classList.add ('visible')
  focusedIdx = -1

  resultsEl.querySelectorAll ('.sr-item').forEach (function (el) {
    el.addEventListener ('click', function () {
      closeDropdown ()
      searchEl.value = ''
      clearBtn.style.display = 'none'
      applyFilter ('')
    })
  })
}

function closeDropdown () {
  resultsEl.classList.remove ('visible')
  focusedIdx = -1
}

function moveFocus (dir) {
  const items = Array.from (resultsEl.querySelectorAll ('.sr-item'))
  if (!items.length) return
  items.forEach (function (el) { el.classList.remove ('focused') })
  focusedIdx = (focusedIdx + dir + items.length) % items.length
  items[focusedIdx].classList.add ('focused')
  items[focusedIdx].scrollIntoView ({ block: 'nearest' })
}

// ── Event listeners ───────────────────────────────────────────────────────────
searchEl.addEventListener ('input', function (e) {
  const q = e.target.value
  renderDropdown (q)
  applyFilter (q)
})

searchEl.addEventListener ('keydown', function (e) {
  if (!resultsEl.classList.contains ('visible')) return
  if (e.key === 'ArrowDown')  { e.preventDefault (); moveFocus (+1) }
  if (e.key === 'ArrowUp')    { e.preventDefault (); moveFocus (-1) }
  if (e.key === 'Enter') {
    const items = resultsEl.querySelectorAll ('.sr-item')
    if (focusedIdx >= 0 && items[focusedIdx]) items[focusedIdx].click ()
    closeDropdown ()
  }
  if (e.key === 'Escape') { closeDropdown () }
})

searchEl.addEventListener ('focus', function () {
  if (searchEl.value) renderDropdown (searchEl.value)
})

document.addEventListener ('click', function (e) {
  if (!searchEl.contains (e.target) && !resultsEl.contains (e.target)) {
    closeDropdown ()
  }
})

clearBtn.addEventListener ('click', function () {
  searchEl.value = ''
  clearBtn.style.display = 'none'
  applyFilter ('')
  closeDropdown ()
  searchEl.focus ()
})

// ── Active TOC highlighting via IntersectionObserver ──────────────────────────
const tocFnMap  = {}
const tocModMap = {}

allTocFns.forEach (function (a)  { tocFnMap[a.getAttribute ('href').slice (1)]  = a })
allTocMods.forEach (function (a) { tocModMap[a.getAttribute ('href').slice (1)] = a })

const observer = new IntersectionObserver (function (entries) {
  entries.forEach (function (entry) {
    if (!entry.isIntersecting) return
    const id  = entry.target.id
    const mod = entry.target.dataset.module || entry.target.id.replace ('module-', '')

    allTocFns.forEach (function (a)  { a.classList.remove ('active') })
    allTocMods.forEach (function (a) { a.classList.remove ('active') })

    if (tocFnMap[id])                   tocFnMap[id].classList.add ('active')
    if (tocModMap['module-' + mod])     tocModMap['module-' + mod].classList.add ('active')

    const activeFn = tocFnMap[id]
    if (activeFn) {
      const sb = sidebar.getBoundingClientRect ()
      const el = activeFn.getBoundingClientRect ()
      if (el.top < sb.top + 32 || el.bottom > sb.bottom - 32) {
        activeFn.scrollIntoView ({ block: 'nearest', behavior: 'smooth' })
      }
    }
  })
}, { rootMargin: '-52px 0px -60% 0px', threshold: 0 })

allEntries.forEach (function (el)  { observer.observe (el) })
allSections.forEach (function (el) { observer.observe (el) })

// ── Keyboard shortcut: / to focus search ──────────────────────────────────────
document.addEventListener ('keydown', function (e) {
  if (e.key === '/' && document.activeElement !== searchEl) {
    e.preventDefault ()
    searchEl.focus ()
    searchEl.select ()
  }
})
