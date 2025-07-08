const { Pool, Client } = require('pg');
require('@dotenvx/dotenvx').config();

const {
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE
} = process.env;

const pool = new Pool({
  host: PG_HOST,
  port: PG_PORT,
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
});

async function dropAndCreateDatabase() {
  const client = new Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: 'postgres',
  });
  try {
    await client.connect();
    // Terminate all connections to the target DB
    await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [PG_DATABASE]);
    await client.query(`DROP DATABASE IF EXISTS "${PG_DATABASE}"`);
    await client.query(`CREATE DATABASE "${PG_DATABASE}"`);
    console.log(`Database "${PG_DATABASE}" dropped and created.`);
  } catch (err) {
    console.error('❌ Error dropping/creating database:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

async function createSchema() {
  const client = new Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
  });

  const createExtension = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
  const createTable = `
  CREATE TABLE IF NOT EXISTS historical_events_db (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(255) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_date - start_date)) / 60
        ) STORED,
    parent_id UUID REFERENCES historical_events_db(event_id) ON DELETE SET NULL,
    research_value INTEGER,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_historical_events_db_start_date ON historical_events_db(start_date);
  CREATE INDEX IF NOT EXISTS idx_historical_events_db_end_date ON historical_events_db(end_date);
  CREATE INDEX IF NOT EXISTS idx_historical_events_db_parent_id ON historical_events_db(parent_id);
  CREATE INDEX IF NOT EXISTS idx_historical_events_db_metadata_jsonb_gin ON historical_events_db USING GIN (metadata);
  `;

  try {
    await client.connect();
    await client.query(createExtension);
    await client.query(createTable);
    console.log('Schema initialized successfully.');
  } catch (err) {
    console.error('Error creating schema:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

async function initializeDatabase() {
  await dropAndCreateDatabase();
  await createSchema();
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initializeDatabase,
};
