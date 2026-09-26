# Frontend — Wildlife Conservation Web App

React + Vite web application for Park Managers and Researchers.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL if needed
npm run dev            # http://localhost:5173
```

## Stack

- React + React Router
- Axios (API client in `src/api/client.js`)
- Tailwind CSS
- Recharts (charts)
- Leaflet / React-Leaflet (maps)

## Structure

```
src/
  api/        # Axios client
  components/ # Reusable UI components
  layouts/    # Page layouts (e.g. dashboard sidebar)
  pages/      # Route-level pages
  App.jsx     # Routes
```

Pages are currently placeholders; each module (auth, patrols, incidents, animals, alerts,
reports) will be implemented incrementally in later phases.
