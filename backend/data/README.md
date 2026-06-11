# Legacy data (NOT MongoDB Atlas)

Signups were previously saved here in `db.json` by an **old API server** on port **5000**.

The current app uses **MongoDB Atlas** (`rental` database, `consultancies` collection) via:

```bash
cd backend
npm run dev   # runs src/index.js on port 5001 (see .env)
```

To check Atlas data: MongoDB Atlas → **rental** → **consultancies**.

If you need old accounts from `db.json`, re-register them after the MongoDB server is running.
