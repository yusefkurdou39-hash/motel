# Online Deploy (Render) — Shared Online Database

Netlify static deploy does not run your Node + SQLite backend.  
Use Render for real online login/data.

## Fast Deploy (recommended)

1. Push this project to GitHub.
2. Open Render and click **New +** -> **Blueprint**.
3. Select your repository.
4. Render reads `render.yaml` automatically.
5. Click **Apply**.

Render will auto-set:
- `npm install`
- `npm start`
- `JWT_SECRET`

## Open your live app

After deploy, open:
- `https://your-app-name.onrender.com`

Health check:
- `https://your-app-name.onrender.com/health`

## Default login

- `admin` / `admin123`

Then change passwords in settings.

## Important note about data

- SQLite file: `motel.db`
- On free instances, restarts/sleep can happen.
- For stronger data persistence, use a persistent disk/paid plan.

