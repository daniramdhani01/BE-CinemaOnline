require('dotenv').config();
const { Client } = require('pg');

const DEFAULT_SCHEMA = process.env.DATABASE_SCHEMA || 'cinema_online';

async function ensureSchema(config) {
  const schema =
    config.schema ||
    config?.define?.schema ||
    DEFAULT_SCHEMA;
  const dialect = (config.dialect || process.env.DATABASE_DIALECT || '').toLowerCase();

  if (!dialect.startsWith('postgres') || !schema) {
    return;
  }

  const client = new Client({
    user: config.username,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database,
    ssl: config?.dialectOptions?.ssl,
  });

  try {
    await client.connect();
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  } catch (error) {
    console.error(`Failed to ensure schema "${schema}" exists`, error);
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

const shared = {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: process.env.DATABASE_DIALECT,
    define: {
        schema: DEFAULT_SCHEMA,
    },
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
        keepAlive: true
    },
    pool: { max: 5, min: 0, acquire: 20000, idle: 10000, evict: 10000 },
    retry: { max: 3 },
    schema: DEFAULT_SCHEMA,
    searchPath: `${DEFAULT_SCHEMA}, public`,
    hooks: {
        beforeConnect: async (connectionConfig = {}) => {
            await ensureSchema({ ...shared, ...connectionConfig });
        },
    },
};

const withTimezone = {
  ...shared,
  timezone: '+07:00',
};

module.exports = {
  development: {
    ...withTimezone,
  },
  test: {
    ...shared,
  },
  production: {
    ...shared,
  },
};
