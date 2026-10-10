const fs = require('fs');
const { Pool } = require('pg');

class StateStore {
  constructor({ file, connectionString }) {
    this.file = file;
    this.pool = connectionString
      ? new Pool({ connectionString, max: 1, connectionTimeoutMillis: 30000 })
      : null;
    this.queue = Promise.resolve();
    this.failure = null;
  }

  async load() {
    if (!this.pool) {
      return fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : null;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS lms_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const result = await this.pool.query('SELECT state FROM lms_state WHERE id = 1');
    if (result.rows.length) return result.rows[0].state;

    if (fs.existsSync(this.file)) {
      const existing = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      await this.save(existing);
      await this.flush();
      return existing;
    }
    return null;
  }

  save(state) {
    if (!this.pool) {
      fs.mkdirSync(require('path').dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(state, null, 1));
      return Promise.resolve();
    }

    const snapshot = JSON.stringify(state);
    const write = this.queue.then(() => this.pool.query(
      `INSERT INTO lms_state (id, state, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
      [snapshot]
    ));
    this.queue = write.then(
      () => { this.failure = null; },
      error => {
        this.failure = error;
        console.error('LMS database save failed:', error);
      }
    );
    write.catch(() => {});
    return write;
  }

  async flush() {
    await this.queue;
    if (this.failure) throw this.failure;
  }

  async close() {
    if (this.pool) await this.pool.end();
  }
}

module.exports = StateStore;
