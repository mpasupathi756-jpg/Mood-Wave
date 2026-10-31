'use strict';
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Convert MySQL '?' placeholders to PostgreSQL '$1', '$2', ... placeholders,
 * safely skipping questions marks inside string literals.
 */
function convertPlaceholders(sql) {
  let paramIdx = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : '';

    if (ch === "'" && prev !== '\\') {
      inSingleQuote = !inSingleQuote;
      result += ch;
    } else if (ch === '"' && prev !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      result += ch;
    } else if (ch === '?' && !inSingleQuote && !inDoubleQuote) {
      paramIdx++;
      result += '$' + paramIdx;
    } else {
      result += ch;
    }
  }

  return result;
}

let poolConfig = {
  max               : 15,
  idleTimeoutMillis : 30000,
  connectionTimeoutMillis: 10000,
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  poolConfig.host     = process.env.DB_HOST     || 'localhost';
  poolConfig.port     = parseInt(process.env.DB_PORT) || 5432;
  poolConfig.user     = process.env.DB_USER     || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD || '';
  poolConfig.database = process.env.DB_NAME     || 'postgres';
}

// Enable SSL if cloud database or requested (Supabase requires SSL)
const isCloud = !!(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1')
);

if (process.env.DB_SSL === 'true' || isCloud || (poolConfig.host && poolConfig.host !== 'localhost' && poolConfig.host !== '127.0.0.1')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute a query with automatic '?' to '$n' parameter conversion.
 * Returns array of rows. Also attaches .insertId (if RETURNING id was used)
 * and .affectedRows (rowCount) for seamless backward compatibility.
 */
const query = async (sql, params = []) => {
  try {
    const pgSql = convertPlaceholders(sql);
    const result = await pool.query(pgSql, params);
    const rows = result.rows || [];

    // Helper compatibility properties
    rows.rowCount = result.rowCount;
    rows.affectedRows = result.rowCount;
    if (rows.length > 0 && rows[0].id !== undefined) {
      rows.insertId = rows[0].id;
    }

    return rows;
  } catch (err) {
    console.error('DB query error:', err.message, '\nSQL:', sql);
    throw err;
  }
};

/**
 * Helper: run and return first row or null
 */
const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] ?? null;
};

/**
 * Test database connectivity
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() AS now, current_database() AS db');
    client.release();
    console.log('✅  PostgreSQL connected →', res.rows[0]?.db || poolConfig.database);
    return true;
  } catch (err) {
    console.error('⚠️  PostgreSQL connection warning:', err.message);
    console.log('ℹ️  Server will continue running. Ensure Supabase or PostgreSQL credentials are set in .env.');
    return false;
  }
};

module.exports = { pool, query, queryOne, testConnection, convertPlaceholders };
