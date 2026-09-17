import { useEffect, useMemo, useState } from 'react'

type Room = {
  id: number
  name: string
  description: string
  price: number
  capacity: number
  size: string
  image: string
  amenities: string[]
}

type Booking = {
  id: string
  roomId: number
  roomName: string
  guestName: string
  email: string
  checkIn: string
  checkOut: string
  guests: number
  total: number
}

const fallbackRooms: Room[] = [
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

const nightsBetween = (from: string, to: string) => {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.round((end - start) / 86400000)
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>(fallbackRooms)
  const [checkIn, setCheckIn] = useState('2026-09-24')
  const [checkOut, setCheckOut] = useState('2026-09-26')
  const [guests, setGuests] = useState(2)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Backend unavailable'))))
      .then((data) => setRooms(data.rooms))
      .catch(() => undefined)
  }, [])

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut])
  const selectedTotal = selectedRoom ? selectedRoom.price * nights : 0

  const openBooking = (room: Room) => {
    setSelectedRoom(room)
    setBookingOpen(true)
    setError('')
  }

  const submitBooking = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedRoom || nights < 1) {
      setError('Please choose valid check-in and check-out dates.')
      return
    }
    if (guests > selectedRoom.capacity) {
      setError(`This room accepts up to ${selectedRoom.capacity} guests.`)
      return
    }
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: selectedRoom.id, guestName, email, checkIn, checkOut, guests }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not create booking')
      setBooking(data.booking)
      setBookingOpen(false)
    } catch {
      setBooking({
        id: `GV-DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        guestName: guestName.trim(),
        email: email.trim().toLowerCase(),
        checkIn,
        checkOut,
        guests,
        total: selectedTotal,
      })
      setBookingOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <header className="nav-shell">
        <div className="nav-inner">
          <a className="brand" href="#top">GRANDVIEW <span>RAIPUR</span></a>
          <nav>
            <a href="#rooms">Rooms</a>
            <a href="#experience">Experience</a>
            <a href="#dining">Dining</a>
            <a href="#location">Location</a>
          </nav>
          <button className="nav-cta" onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}>Book now</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-media" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow">A modern stay in the heart of Raipur</div>
          <h1>Stay beautifully.<br /><em>Rest effortlessly.</em></h1>
          <p>Thoughtfully designed rooms, warm hospitality and direct booking — all in one place.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}>Explore rooms</button>
            <a className="text-link" href="#experience">Discover the hotel →</a>
          </div>
        </div>

        <div className="booking-bar">
          <div className="field"><label>Check-in</label><input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div>
          <div className="field"><label>Check-out</label><input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} /></div>
          <div className="field compact"><label>Guests</label><select value={guests} onChange={(e) => setGuests(Number(e.target.value))}><option value={1}>1 Guest</option><option value={2}>2 Guests</option><option value={3}>3 Guests</option><option value={4}>4 Guests</option></select></div>
          <button className="search-btn" onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}>Search rooms</button>
        </div>
      </section>

      <section className="intro" id="experience">
        <div><div className="section-kicker">The Grandview experience</div><h2>Everything you need.<br /><span>Nothing you don’t.</span></h2></div>
        <p>Designed for business trips, weekend escapes and everything between. Expect calm spaces, attentive service and a location that keeps Raipur within easy reach.</p>
      </section>

      <section className="feature-grid" id="dining">
        <article className="feature-card large feature-room"><div className="feature-content"><span>01 / ROOMS</span><h3>Quiet luxury, made practical.</h3><a href="#rooms">View rooms →</a></div></article>
        <article className="feature-card feature-food"><div className="feature-content"><span>02 / DINING</span><h3>Local flavour, modern table.</h3><a href="#dining">Discover dining →</a></div></article>
        <article className="feature-card feature-service"><div className="feature-content"><span>03 / SERVICE</span><h3>Hospitality that remembers the details.</h3></div></article>
      </section>

      <section className="rooms-section" id="rooms">
        <div className="rooms-heading"><div><div className="section-kicker">Stay your way</div><h2>Rooms & suites</h2></div><span className="availability">● Live availability</span></div>
        <div className="room-list">
          {rooms.map((room) => (
            <article className="room-card" key={room.id}>
              <div className="room-image" style={{ backgroundImage: `url(${room.image})` }} />
              <div className="room-body"><div className="room-topline"><span>{room.size}</span><span>Up to {room.capacity} guests</span></div><h3>{room.name}</h3><p>{room.description}</p><div className="room-tags">{room.amenities.map((item) => <span key={item}>{item}</span>)}</div><div className="room-footer"><div><strong>{formatCurrency(room.price)}</strong><span> / night</span></div><button onClick={() => openBooking(room)}>Reserve room</button></div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="location-section" id="location">
        <div className="location-copy"><div className="section-kicker">Perfectly placed</div><h2>Stay close to<br /><span>what matters.</span></h2><p>Conveniently located for city business, shopping, dining and local travel. The hotel team can arrange cabs and airport transfers on request.</p><div className="distance-list"><div><span>Railway Station</span><strong>10 min</strong></div><div><span>Airport</span><strong>25 min</strong></div><div><span>City Centre</span><strong>8 min</strong></div></div></div>
        <div className="map-card"><div className="map-grid" /><div className="map-pin">GRANDVIEW</div><div className="map-label">Raipur, Chhattisgarh</div></div>
      </section>

      <footer><div className="footer-brand">GRANDVIEW RAIPUR</div><p>Direct booking. Thoughtful stays.</p><div className="footer-links"><a href="#top">Back to top ↑</a><span>© 2026 Grandview Hospitality</span></div></footer>

      {bookingOpen && selectedRoom && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setBookingOpen(false)}>
          <div className="booking-modal"><button className="close" onClick={() => setBookingOpen(false)}>×</button><div className="section-kicker">Reserve directly</div><h2>{selectedRoom.name}</h2><div className="booking-summary"><span>{checkIn} → {checkOut}</span><strong>{nights} {nights === 1 ? 'night' : 'nights'} · {formatCurrency(selectedTotal)}</strong></div>
            <form onSubmit={submitBooking}><label>Full name<input value={guestName} onChange={(e) => setGuestName(e.target.value)} required placeholder="Your name" /></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></label>{error && <div className="form-error">{error}</div>}<button className="primary-btn full" disabled={loading}>{loading ? 'Confirming…' : 'Confirm booking'}</button></form>
            <p className="modal-note">Live backend when available; GitHub Pages uses a demo confirmation so you can test the full flow.</p>
          </div>
        </div>
      )}

      {booking && (
        <div className="modal-backdrop"><div className="booking-modal success"><div className="success-icon">✓</div><div className="section-kicker">Booking confirmed</div><h2>You’re booked.</h2><p>Your direct reservation has been created successfully.</p><div className="confirmation"><span>Confirmation</span><strong>{booking.id}</strong><span>Room</span><strong>{booking.roomName}</strong><span>Stay</span><strong>{booking.checkIn} → {booking.checkOut}</strong><span>Total</span><strong>{formatCurrency(booking.total)}</strong></div><button className="primary-btn full" onClick={() => setBooking(null)}>Done</button></div></div>
      )}
    </main>
  )
}
