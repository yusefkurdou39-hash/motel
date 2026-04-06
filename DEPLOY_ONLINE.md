# Put Your Motel Site Online

This project is now ready for static hosting.

## Quick Deploy (Netlify)

1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your whole `motel` folder into the page.
3. Wait for deploy to finish.
4. Open your site URL (`*.netlify.app`).

Your homepage will load `working-motel.html` automatically.

## Deploy from GitHub (Recommended)

1. Create a GitHub repo and push this folder.
2. In Netlify, click **Add new site** -> **Import an existing project**.
3. Choose your GitHub repo.
4. Build command: leave empty.
5. Publish directory: `.`
6. Deploy.

## Important Note About Data

This app stores data in browser local storage.

- Data is per browser/device.
- If staff use different phones/computers, they will not share the same data.

If you want shared live data for all devices, next step is moving to a backend + database deployment.

