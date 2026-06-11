export function validateEnv() {
  const uri = process.env.MONGODB_URI || '';
  const jwt = process.env.JWT_SECRET || '';

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Copy backend/.env.example to backend/.env and set your Atlas connection string.'
    );
  }

  const badPlaceholders = [
    '<db_password>',
    'YOUR_ATLAS_DB_USER_PASSWORD',
    'REPLACE_WITH',
    'YOUR_PASSWORD',
    '<password>',
  ];
  if (badPlaceholders.some((p) => uri.includes(p))) {
    throw new Error(
      'MONGODB_URI still contains a placeholder password.\n' +
        'In MongoDB Atlas: Database → Connect → Drivers → copy the connection string,\n' +
        'replace <password> with the password you set for user "loganathanofficial25_db_user".\n' +
        'Use database name "rental" in the URI: ...mongodb.net/rental?appName=Cluster0'
    );
  }

  if (!jwt || jwt === 'change-this-to-a-long-random-secret') {
    throw new Error(
      'JWT_SECRET is not set. Run: openssl rand -base64 32\n' +
        'Paste the output into backend/.env as JWT_SECRET=...'
    );
  }
}
