# Local audited copy

The original import is preserved in the sibling `hi anzy website` folder. This `hi-anzy-audit` copy contains the changes.

## This machine

- Frontend: http://127.0.0.1:3100 (production preview)
- API: http://127.0.0.1:8111/api/health
- MongoDB: 127.0.0.1:27117, database `hianzy_audit`
- Data is persisted in `../local-runtime/mongo-data`.
- MongoDB was downloaded from its official distribution through `mongodb-memory-server`; it runs a real MongoDB process, not an API mock.
- Email sending is disabled in the local configuration. Browser test submissions are saved locally.

Run the `Start-hiAnzy.ps1` file in this task's `outputs` folder to restart stopped services. It leaves already-listening ports alone. To edit with hot reload, stop the preview process first and run `npm start` in `frontend` instead.

## Dependencies and tests

Use Node 22.14+ and npm 11+. An npm 11 CLI is installed only in `../local-runtime/node_modules/npm`; this avoids a peer-resolution crash in the machine's npm 10. The frontend lockfile is regenerated and committed changes should include it.

```powershell
cd frontend
node ../../local-runtime/node_modules/npm/bin/npm-cli.js ci
npm test
npm run lint
npm run build
```

From the project root, with MongoDB listening on 27117:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -q
```

These tests create a uniquely named `hianzy_test_*` database and delete only that database afterwards. They do not use the preview database or send email. `tests/test_contact_poc.py` is the original Docker-specific manual check; it is not the pytest suite. `requirements-audit-lock.txt` records the exact Python test environment from this audit. The backend's `requirements.txt` retains runtime-only dependencies with pinned direct versions.

## Deployment limits

Docker was unavailable on this host. Docker configuration has been updated for Vite, but the container build was not executed. External Google sign-in and email delivery require their real service configuration and were not exercised. The marketing SPA still depends on JavaScript for page-specific metadata; prerendering/SSR is a separate production improvement. Large lazy 3D bundles still produce a build-size advisory. This audit is evidence of the checks performed, not a claim that every possible defect is eliminated.
