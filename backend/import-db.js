const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function importDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Set DATABASE_URL to the destination PostgreSQL connection string.');

  const source = path.resolve(process.argv[2] || path.join(__dirname, 'db.json'));
  if (!fs.existsSync(source)) throw new Error(`Local database file not found: ${source}`);
  const state = JSON.parse(fs.readFileSync(source, 'utf8'));
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 30000 });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const imported = await pool.query(
      `INSERT INTO lms_state (id, state, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [JSON.stringify(state)]
    );
    if (!imported.rowCount) throw new Error('Destination database already has LMS data; import stopped without overwriting it.');
    console.log('LMS data imported successfully. Student and lead records were not printed.');
  } finally {
    await pool.end();
  }
}

importDatabase().catch(error => {
  console.error('LMS data import failed:', error.message);
  process.exitCode = 1;
});
