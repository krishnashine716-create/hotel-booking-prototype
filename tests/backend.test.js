import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

let server
let tempDir
let port
let baseUrl

function startServer() {
  server = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DATABASE_URL: '', BOOKINGS_FILE: path.join(tempDir, 'bookings.json') },
    stdio: 'ignore',
  })
}
async function waitForHealth() {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) throw new Error('API server exited before becoming healthy')
    try {
      const response = await fetch(baseUrl + '/api/health')
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('API server did not become healthy')
}
async function stopServer() {
  if (!server || server.exitCode !== null) return
  server.kill('SIGTERM')
  await new Promise((resolve) => {
    server.once('exit', resolve)
    setTimeout(resolve, 1500).unref()
  })
}

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'hotel-api-test-'))
  port = 4300 + Math.floor(Math.random() * 1000)
  baseUrl = 'http://127.0.0.1:' + port
  startServer()
  await waitForHealth()
})
after(async () => {
  await stopServer()
  await rm(tempDir, { recursive: true, force: true })
})

test('validates dates, persists reservations, and rejects overlapping bookings', async () => {
  const invalid = await fetch(baseUrl + '/api/availability?roomId=1&checkIn=2026-99-99&checkOut=2026-99-30')
  assert.equal(invalid.status, 400)

  const checkIn = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const checkOut = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const payload = { roomId: 1, guestName: 'Test Guest', email: 'guest@example.com', checkIn, checkOut, guests: 2 }
  const created = await fetch(baseUrl + '/api/bookings', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  assert.equal(created.status, 201)
  const createdData = await created.json()
  assert.match(createdData.booking.id, /^GV-/)
  assert.equal(createdData.booking.total, 3499)

  const duplicate = await fetch(baseUrl + '/api/bookings', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  assert.equal(duplicate.status, 409)

  const availability = await fetch(baseUrl + '/api/availability?roomId=1&checkIn=' + checkIn + '&checkOut=' + checkOut)
  assert.equal((await availability.json()).available, false)

  await stopServer()
  startServer()
  await waitForHealth()
  const persisted = await fetch(baseUrl + '/api/availability?roomId=1&checkIn=' + checkIn + '&checkOut=' + checkOut)
  assert.equal((await persisted.json()).available, false)
})
