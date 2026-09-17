# Hotel Booking Prototype

A modern, responsive direct-booking website prototype for independent hotels.

## What is included

- Responsive hotel landing page
- Room catalogue and live availability-style UI
- Date and guest selection
- Working booking form connected to an Express API
- Booking confirmation flow
- Demo REST endpoints for rooms and bookings
- Vite + React + TypeScript frontend
- Express backend

## Run locally

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npm run server
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend on `http://localhost:4000`.

## Next steps

Connect PostgreSQL/Supabase for persistent bookings, add payment processing, create a hotel admin dashboard, and evolve the shared backend into the StayOS platform.
