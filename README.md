# Hotel Booking Prototype

A modern, responsive direct-booking website prototype for independent hotels.

## Current prototype

- Responsive hotel landing page
- Room catalogue with demo availability data
- Date and guest selection
- Direct booking modal
- Booking validation and confirmation flow
- Express API for rooms and bookings
- Frontend fallback so the public GitHub Pages demo remains interactive
- Vite + React + TypeScript frontend
- Express backend

## Run locally

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

In a second terminal, start the backend:

```bash
npm run server
```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:4000`.

## Public preview

The `main` branch is configured for automatic GitHub Pages deployment through GitHub Actions. Each push to `main` builds `dist/` and deploys the static frontend.

Expected preview URL:

`https://krishnashine716-create.github.io/hotel-booking-prototype/`

The public Pages version uses the frontend's demo fallback because GitHub Pages hosts the static frontend only. The Express API can be deployed separately later and connected through an environment variable.

## Next steps

1. Move bookings into PostgreSQL/Supabase.
2. Add real availability and room inventory.
3. Add payment processing and transactional booking emails.
4. Deploy the Express API and connect it to the live frontend.
5. Add a hotel admin dashboard.
6. Evolve the shared backend into the StayOS platform.
