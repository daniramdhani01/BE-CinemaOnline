'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const { logSystem, logSystemError } = require('../src/middlewares/logger');
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const formatConnectionLabel = (options = {}) => {
  const cfg = { ...sequelize.config, ...options };
  const database = cfg.database || cfg.host || 'database';
  const host = cfg.host ? `@${cfg.host}` : '';
  const username = cfg.username || 'unknown';
  return `${database}${host} as ${username}`;
};

sequelize.beforeConnect((options) => {
  logSystem('DB', `Attempting connection (${formatConnectionLabel(options)})`);
});

sequelize.afterConnect((connection, options) => {
  logSystem('DB', `Connection established (${formatConnectionLabel(options)})`);
});

sequelize.beforeDisconnect((connection) => {
  logSystem('DB', `Disconnecting from database (${formatConnectionLabel()})`);
});

sequelize.afterDisconnect((connection) => {
  logSystem('DB', `Disconnected from database (${formatConnectionLabel()})`);
});

sequelize.authenticate().catch((err) => {
  logSystemError('DB', err);
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
