import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const app = express()
const PORT = Number(process.env.PORT || 4000)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = process.env.BOOKINGS_FILE || path.join(__dirname, 'data', 'bookings.json')
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
}) : null

const rooms = [
  { id: 1, name: 'Deluxe King Room', description: 'Warm, spacious interiors with a king bed and a quiet city-facing balcony.', price: 3499, capacity: 2, size: '34 m²', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85', amenities: ['King bed', 'City view', 'Breakfast', 'Wi-Fi'] },
  { id: 2, name: 'Executive Suite', description: 'A refined suite with a living area, work desk and extra space for longer stays.', price: 5499, capacity: 3, size: '52 m²', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85', amenities: ['King bed', 'Living area', 'Breakfast', 'Airport transfer'] },
  { id: 3, name: 'Premier Twin Room', description: 'Two comfortable beds, natural light and modern essentials for business or family stays.', price: 4299, capacity: 3, size: '40 m²', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85', amenities: ['Twin beds', 'Work desk', 'Breakfast', 'Wi-Fi'] },
]

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true }))
app.use(express.json({ limit: '32kb' }))

let fileQueue = Promise.resolve()
async function readFileBookings() {
  try {
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, '[]\n', { flag: 'wx' }).catch((e) => { if (e.code !== 'EEXIST') throw e })
    return []
  }
}
async function writeFileBookings(bookings) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  const temp = DATA_FILE + '.' + process.pid + '.tmp'
  await fs.writeFile(temp, JSON.stringify(bookings, null, 2) + '\n', { mode: 0o600 })
  await fs.rename(temp, DATA_FILE)
}
async function initialize() {
  if (!pool) return
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      room_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      email TEXT NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests INTEGER NOT NULL CHECK (guests > 0),
      nights INTEGER NOT NULL CHECK (nights > 0),
      total INTEGER NOT NULL CHECK (total >= 0),
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (check_out > check_in)
    );
    CREATE INDEX IF NOT EXISTS bookings_room_dates_idx ON bookings (room_id, check_in, check_out);
  \`)
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
function validateStay(checkIn, checkOut) {
  if (!validDate(checkIn) || !validDate(checkOut)) return 'Use valid check-in and check-out dates.'
  if (checkOut <= checkIn) return 'Check-out must be after check-in.'
  if (checkIn < new Date().toISOString().slice(0, 10)) return 'Check-in cannot be in the past.'
  const nights = (Date.parse(checkOut + 'T00:00:00Z') - Date.parse(checkIn + 'T00:00:00Z')) / 86400000
  if (nights > 90) return 'Bookings can be up to 90 nights.'
  return null
}
function overlaps(booking, roomId, checkIn, checkOut) {
  return Number(booking.roomId ?? booking.room_id) === roomId &&
    booking.status !== 'cancelled' && booking.checkIn < checkOut && booking.checkOut > checkIn
}
async function listBookings() {
  if (!pool) return readFileBookings()
  const { rows } = await pool.query("SELECT id, room_id AS \"roomId\", room_name AS \"roomName\", guest_name AS \"guestName\", email, to_char(check_in, 'YYYY-MM-DD') AS \"checkIn\", to_char(check_out, 'YYYY-MM-DD') AS \"checkOut\", guests, nights, total, status, created_at AS \"createdAt\" FROM bookings")
  return rows
}
async function createBooking(input) {
  const nights = (Date.parse(input.checkOut + 'T00:00:00Z') - Date.parse(input.checkIn + 'T00:00:00Z')) / 86400000
  const booking = {
    id: 'GV-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    roomId: input.room.id, roomName: input.room.name,
    guestName: input.guestName.trim(), email: input.email.trim().toLowerCase(),
    checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests,
    nights, total: input.room.price * nights, status: 'confirmed', createdAt: new Date().toISOString(),
  }
  if (pool) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock($1)', [booking.roomId])
      const conflict = await client.query("SELECT 1 FROM bookings WHERE room_id = $1 AND status <> 'cancelled' AND check_in < $3::date AND check_out > $2::date LIMIT 1", [booking.roomId, booking.checkIn, booking.checkOut])
      if (conflict.rowCount) {
        await client.query('ROLLBACK')
        return { conflict: true }
      }
      await client.query('INSERT INTO bookings (id, room_id, room_name, guest_name, email, check_in, check_out, guests, nights, total, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [booking.id, booking.roomId, booking.roomName, booking.guestName, booking.email, booking.checkIn, booking.checkOut, booking.guests, booking.nights, booking.total, booking.status, booking.createdAt])
      await client.query('COMMIT')
      return { booking }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally { client.release() }
  }
  let result
  fileQueue = fileQueue.then(async () => {
    const existing = await readFileBookings()
    if (existing.some((item) => overlaps(item, booking.roomId, booking.checkIn, booking.checkOut))) {
      result = { conflict: true }
      return
    }
    existing.push(booking)
    await writeFileBookings(existing)
    result = { booking }
  })
  await fileQueue
  return result
}

app.get('/api/health', async (_req, res) => {
  try {
    if (pool) await pool.query('SELECT 1')
    else await readFileBookings()
    res.json({ status: 'ok', service: 'hotel-booking-prototype-api', storage: pool ? 'postgresql' : 'local-file' })
  } catch {
    res.status(503).json({ status: 'error', message: 'Storage is unavailable.' })
  }
})
app.get('/api/rooms', (_req, res) => res.json({ rooms }))
app.get('/api/availability', async (req, res, next) => {
  try {
    const roomId = Number(req.query.roomId)
    const { checkIn, checkOut } = req.query
    if (!rooms.some((room) => room.id === roomId)) return res.status(404).json({ message: 'Room not found.' })
    const dateError = validateStay(checkIn, checkOut)
    if (dateError) return res.status(400).json({ message: dateError })
    const bookings = await listBookings()
    res.json({ roomId, available: !bookings.some((b) => overlaps(b, roomId, checkIn, checkOut)) })
  } catch (error) { next(error) }
})
app.post('/api/bookings', async (req, res, next) => {
  try {
    const { roomId, guestName, email, checkIn, checkOut, guests } = req.body ?? {}
    const room = rooms.find((item) => item.id === Number(roomId))
    if (!room) return res.status(404).json({ message: 'Room not found.' })
    const cleanName = typeof guestName === 'string' ? guestName.trim() : ''
    const cleanEmail = typeof email === 'string' ? email.trim() : ''
    if (cleanName.length < 2 || cleanName.length > 100) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' })
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ message: 'Enter a valid email address.' })
    const guestCount = Number(guests)
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > room.capacity) return res.status(400).json({ message: 'This room accepts 1 to ' + room.capacity + ' guests.' })
    const dateError = validateStay(checkIn, checkOut)
    if (dateError) return res.status(400).json({ message: dateError })
    const result = await createBooking({ room, guestName: cleanName, email: cleanEmail, checkIn, checkOut, guests: guestCount })
    if (result.conflict) return res.status(409).json({ message: 'This room is no longer available for those dates. Please choose different dates.' })
    res.status(201).json({ booking: result.booking })
  } catch (error) { next(error) }
})
app.use((error, _req, res, _next) => {
  console.error('API error:', error)
  res.status(500).json({ message: 'Something went wrong while processing your request. Please try again.' })
})

initialize().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log('Hotel booking API listening on port ' + PORT))
}).catch((error) => {
  console.error('Could not initialize booking storage:', error)
  process.exit(1)
})
