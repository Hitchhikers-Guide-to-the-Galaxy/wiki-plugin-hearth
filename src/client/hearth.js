/*
 * Federated Wiki : Hearth Plugin
 *
 * A `hearth` item marks a page as keeping to its hearth — meant to stay in the
 * private space it was written in. On render it tints the whole page with a
 * warm halo and shows its own plain-text notice, so even a copy that escapes to
 * a wiki without our client still carries the words that ask it home.
 *
 * The teeth — blocking fork, drag-out and drop-in — live in wiki-plugin-hitchhiker's
 * wiki-ux.js, which runs farm-wide and detects this item by the `hearth-page`
 * class this file adds. See the hearth-pages spec on mouse.localhost.
 *
 * Licensed under the MIT license.
 */

const escapeHtml = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// fedwiki-dsl: UPPERCASE first word = command, optional trailing colon.
// NOTE line adds a custom notice; EXPIRES <iso> declares a disappearing page
// (the reaper reads it server-side; here we just surface it).
export const parse = text => {
  const opts = {
    notice: 'This page keeps to its hearth. Please do not republish it outside its home.',
    expires: '',
  }
  for (const line of (text || '').split(/\n/)) {
    const m = line.match(/^([A-Z]+):?\s+(.*)$/)
    if (!m) continue
    const [, cmd, arg] = m
    if (cmd === 'NOTE') opts.notice = arg.trim() || opts.notice
    if (cmd === 'EXPIRES') opts.expires = arg.trim()
  }
  return opts
}

// A human, timezone-aware countdown, or '' when not expiring / already past.
export const countdown = (expires, now = Date.now()) => {
  if (!expires) return ''
  const when = Date.parse(expires.replace(/Z$/, 'Z'))
  if (Number.isNaN(when)) return ''
  const secs = Math.round((when - now) / 1000)
  if (secs <= 0) return 'expired'
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (d) return `disappears in ${d}d ${h}h`
  if (h) return `disappears in ${h}h ${m}m`
  return `disappears in ${m}m`
}

export const emit = (div, item) => {
  const opts = parse(item.text || '')
  const $page = div.parents('.page')
  $page.addClass('hearth-page')

  const cd = countdown(opts.expires)
  div.html(`
    <div class="hearth-mark" style="display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:6px;background:rgba(200,120,40,0.12);border:1px solid rgba(200,120,40,0.4);font-size:0.85em;">
      <span aria-hidden="true" style="font-size:1.3em;">\u{1F3E0}</span>
      <span class="hearth-notice">${escapeHtml(opts.notice)}</span>
      ${cd ? `<span class="hearth-expiry" style="margin-left:auto;color:#a05000;font-family:ui-monospace,monospace;">${escapeHtml(cd)}</span>` : ''}
    </div>
  `)
}

export const bind = (div, item) => {
  div.find('.hearth-mark').on('dblclick', () => wiki.textEditor(div, item))
}

if (typeof window !== 'undefined') {
  window.plugins = window.plugins || {}
  window.plugins['hearth'] = { emit, bind }

  // Farm-wide halo — injected once. wiki-plugin-hitchhiker styles it further.
  if (!document.getElementById('hearth-style')) {
    const s = document.createElement('style')
    s.id = 'hearth-style'
    s.textContent =
      '.page.hearth-page{box-shadow:inset 0 0 0 3px rgba(200,120,40,0.5),0 0 22px rgba(200,120,40,0.35);' +
      'background:linear-gradient(rgba(200,120,40,0.05),rgba(200,120,40,0.05));}'
    document.head.appendChild(s)
  }
}
