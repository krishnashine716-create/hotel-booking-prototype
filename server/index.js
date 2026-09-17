import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const rooms = [
  {
    id: 1,
    name: 'Deluxe King Room',
    description: 'Warm, spacious interiors with a king bed and a quiet city-facing balcony.',
    price: 3499,
    capacity: 2,
    size: '34 m²',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85',
    amenities: ['King bed', 'City view', 'Breakfast', 'Wi-Fi'],
  },
  {
    id: 2,
    name: 'Executive Suite',
    description: 'A refined suite with a living area, work desk and extra space for longer stays.',
    price: 5499,
    capacity: 3,
    size: '52 m²',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85',
    amenities: ['King bed', 'Living area', 'Breakfast', 'Airport transfer'],
  },
  {
    id: 3,
    name: 'Premier Twin Room',
    description: 'Two comfortable beds, natural light and modern essentials for business or family stays.',
    price: 4299,
    capacity: 3,
    size: '40 m²',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85',
    amenities: ['Twin beds', 'Work desk', 'Breakfast', 'Wi-Fi'],
  },
]

const bookings = []

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hotel-booking-prototype-api' })
})

app.get('/api/rooms', (_req, res) => {
  res.json({ rooms })
})

app.get('/api/bookings', (_req, res) => {
  res.json({ bookings })
})

app.post('/api/bookings', (req, res) => {
  const { roomId, guestName, email, checkIn, checkOut, guests } = req.body ?? {}
  const room = rooms.find((item) => item.id === Number(roomId))

  if (!room) return res.status(404).json({ message: 'Room not found.' })
  if (!guestName || !email || !checkIn || !checkOut) {
    return res.status(400).json({ message: 'Guest name, email, check-in and check-out are required.' })
  }

  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000)

  if (!Number.isFinite(nights) || nights < 1) {
    return res.status(400).json({ message: 'Check-out must be after check-in.' })
  }
  if (Number(guests) < 1 || Number(guests) > room.capacity) {
    return res.status(400).json({ message: `This room accepts up to ${room.capacity} guests.` })
  }

  const booking = {
    id: `GV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    roomId: room.id,
    roomName: room.name,
    guestName: String(guestName).trim(),
    email: String(email).trim().toLowerCase(),
    checkIn,
    checkOut,
    guests: Number(guests),
    nights,
    total: room.price * nights,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }

  bookings.push(booking)
  return res.status(201).json({ booking })
})

app.listen(PORT, () => {
  console.log(`Hotel booking API running on http://localhost:${PORT}`)
})
