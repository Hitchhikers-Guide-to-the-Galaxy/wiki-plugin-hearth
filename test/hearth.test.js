import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse, countdown, guardPage } from '../src/client/hearth.js'

test('a bare hearth item has a default notice and no expiry', () => {
  const opts = parse('')
  assert.match(opts.notice, /keeps to its hearth/)
  assert.equal(opts.expires, '')
})

test('NOTE overrides the notice, EXPIRES sets the deadline', () => {
  const opts = parse('NOTE Mice only.\nEXPIRES 2026-07-14T18:00Z')
  assert.equal(opts.notice, 'Mice only.')
  assert.equal(opts.expires, '2026-07-14T18:00Z')
})

test('countdown is empty without an expiry', () => {
  assert.equal(countdown(''), '')
})

test('countdown reads expired in the past and a duration in the future', () => {
  const now = Date.parse('2026-07-12T12:00:00Z')
  assert.equal(countdown('2026-07-12T11:00:00Z', now), 'expired')
  assert.equal(countdown('2026-07-12T13:30:00Z', now), 'disappears in 1h 30m')
  assert.equal(countdown('2026-07-14T12:00:00Z', now), 'disappears in 2d 0h')
})

test('a garbage EXPIRES never crashes and reads as no countdown', () => {
  assert.equal(countdown('not-a-date'), '')
})

test('guardPage swallows double-click only away from home, and binds once', () => {
  const el = new EventTarget()
  el.dataset = {}
  let remote = false
  const $page = { 0: el, hasClass: c => c === 'remote' && remote }
  guardPage($page)
  guardPage($page) // second call must not stack a listener

  let e = new Event('dblclick', { cancelable: true })
  el.dispatchEvent(e)
  assert.equal(e.defaultPrevented, false, 'at home the double-click passes')

  remote = true
  e = new Event('dblclick', { cancelable: true })
  el.dispatchEvent(e)
  assert.equal(e.defaultPrevented, true, 'away from home the double-click is blocked')
})
