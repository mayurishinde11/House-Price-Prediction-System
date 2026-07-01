# Frontend

The frontend for EstateIQ is served directly by Flask using Jinja2 templates 
and static files located in:

- `backend/templates/` — HTML pages (Home, Predict, Budget, Dashboard, Login, Signup)
- `backend/static/css/` — CSS design system
- `backend/static/js/` — JavaScript (predictions, auth, budget, dashboard)

No separate frontend build step is required. Run `python app.py` from 
the `backend/` folder to serve the full application including all frontend pages.

If you want to rebuild the frontend as a standalone React/Vite app in the future,
scaffold it here with:
    npm create vite@latest . -- --template react