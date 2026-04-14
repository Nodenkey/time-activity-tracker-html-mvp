# Frontend - Time & Activity Tracker (HTML/JS)

This directory contains the plain HTML/CSS/JavaScript frontend for the Time & Activity Tracker.

## Local development

1. Ensure the backend is running on http://localhost:8000.
2. From the repo root, run:

   ```bash
   docker compose up --build
   ```

3. Open the frontend in your browser at http://localhost:3000.

The frontend calls the backend API at `http://localhost:8000/api`.

## Files

- `index.html` – Main UI with time entry form, filters, and entries table.
- `styles.css` – Layout and styling for the app.
- `app.js` – Client-side logic for CRUD operations, filters, and validation.
- `Dockerfile` – Nginx-based container for serving the static frontend.
- `railway.toml` – Railway configuration for deploying the frontend service.
