# Backend setup (MongoDB + secrets)

## 1. JWT_SECRET (you create this — not from MongoDB)

`JWT_SECRET` is only for signing login tokens in this app. Generate any long random string:

```bash
openssl rand -base64 32
```

Put the result in `backend/.env`:

```env
JWT_SECRET=paste-the-output-here
```

## 2. MongoDB password (`db_password`)

This is **not** your Atlas login email password. It is the password for the **database user** `loganathanofficial25_db_user`.

### Get or reset it in Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign in.
2. Open your project → **Database Access** (left sidebar).
3. Find user **loganathanofficial25_db_user** → **Edit** → **Edit Password** (set a new password and save it).
4. **Network Access** → **Add IP Address** → for local dev use **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current IP.

### Build the connection string

1. **Database** → **Connect** → **Drivers** → copy the Node.js connection string.
2. It looks like:
   ```
   mongodb+srv://loganathanofficial25_db_user:<password>@cluster0.gcroq8r.mongodb.net/?appName=Cluster0
   ```
3. Replace `<password>` with your real user password (no angle brackets).
4. Add the database name **`rental`** before `?`:

```env
MONGODB_URI=mongodb+srv://loganathanofficial25_db_user:YOUR_REAL_PASSWORD@cluster0.gcroq8r.mongodb.net/rental?appName=Cluster0
```

If the password has special characters (`@`, `#`, `%`, etc.), [URL-encode](https://www.urlencoder.org/) only the password part.

## 3. Example `.env`

```env
PORT=5000
JWT_SECRET=0C5D0YNXbBm6jt4NF7ya8/u+iTSaVKLBhRwA+v51d4k=
MONGODB_URI=mongodb+srv://loganathanofficial25_db_user:MyAtlasPass123@cluster0.gcroq8r.mongodb.net/rental?appName=Cluster0
```

## 4. Run

```bash
cd backend
npm run seed
npm run dev
```

If seed fails, read the error message — the app now checks for placeholder passwords and common connection issues.
