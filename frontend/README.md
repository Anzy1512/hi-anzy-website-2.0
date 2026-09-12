# hiAnzy frontend

React 18, Vite 7, Tailwind CSS 3, React Router 7. See `../LOCAL-DEVELOPMENT.md`.

- `npm start`: development server at http://127.0.0.1:3100.
- `npm run build`: verified production build into `build/`.
- `npm run preview`: serve that production build locally.
- `npm test`: component regression suite.
- `npm run lint`: React hook checks.

The empty `REACT_APP_BACKEND_URL` uses the local Vite `/api` proxy. `LOCAL_API_URL` selects the backend (default http://127.0.0.1:8111). Production Docker uses an explicit API origin.
