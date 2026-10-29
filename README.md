# Hotel Booking Prototype

A responsive direct-booking website prototype for independent hotels, with an Express API and persistent booking storage.

## Features

- Responsive hotel landing page and room catalogue
- Room, guest, and date validation
- Availability endpoint and prevention of overlapping reservations for the same room
- Persistent local JSON storage for local development
- PostgreSQL storage when `DATABASE_URL` is configured
- API health endpoint for deployment monitoring
- The frontend only displays a confirmed booking after the API accepts it
- Configure a separately hosted API with `VITE_API_BASE_URL`

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npm run server
```

Frontend: `http://localhost:5173`
API health: `http://localhost:4000/api/health`

Without `DATABASE_URL`, bookings persist to `server/data/bookings.json`. This is for local development only. Use PostgreSQL for hosted deployments.

## Deploy the API

A Render blueprint is provided in `render.yaml`. Create a managed PostgreSQL database and deploy the repository as a Web Service. Configure these environment variables in the API service:

- `DATABASE_URL`: PostgreSQL connection string from your database provider
- `CORS_ORIGIN`: public frontend origin, e.g. `https://krishnashine716-create.github.io`

The API health check is `/api/health`. For the frontend build, set `VITE_API_BASE_URL` to the deployed API base URL (for example, `https://your-api.onrender.com`) and rebuild/redeploy the static frontend.

## Important limitations before launch

This remains a prototype until the API and PostgreSQL database are deployed, the public frontend is rebuilt with the API URL, and end-to-end tests pass. It does not process payments, send transactional emails, provide cancellation/admin workflows, or manage multiple hotels. Do not accept paid guest bookings until deployment and testing are complete.
