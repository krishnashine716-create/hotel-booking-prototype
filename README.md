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

## Deploy the backend

1. Open the repository on Render and choose **New > Blueprint**, then select this repository. The `render.yaml` blueprint defines the Express API and a PostgreSQL database.
2. Wait for the API deployment to finish. Test `https://YOUR-API.onrender.com/api/health`; it should return `status: "ok"` and `storage: "postgresql"`.
3. In GitHub, open **Settings > Secrets and variables > Actions > Variables** and create a repository variable named `VITE_API_BASE_URL` with the API base URL, without a trailing slash (for example, `https://your-api.onrender.com`).
4. Merge this branch into `main` and rerun the **Deploy hotel website to GitHub Pages** workflow. The public frontend build will then call the deployed API.

The API allows the current GitHub Pages origin in `CORS_ORIGIN`. If you use a custom domain, update that variable in Render to the exact origin.

## Important limitations before launch

This remains a prototype until the API and PostgreSQL database are deployed, the public frontend is rebuilt with the API URL, and end-to-end tests pass. It does not process payments, send transactional emails, provide cancellation/admin workflows, or manage multiple hotels. Do not accept paid guest bookings until deployment and testing are complete.
