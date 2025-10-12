require('dotenv').config();

const shared = {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: process.env.DATABASE_DIALECT,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
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