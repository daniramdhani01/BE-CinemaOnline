'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS "cinema_online";');
    await queryInterface.createTable({ schema: 'cinema_online', tableName: 'tb_films' }, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      thumbnail: {
        allowNull: false,
        type: Sequelize.STRING
      },
      poster: {
        type: Sequelize.STRING
      },
      category: {
        allowNull: false,
        type: Sequelize.STRING
      },
      price: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      link: {
        allowNull: false,
        type: Sequelize.STRING
      },
      desc: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable({ schema: 'cinema_online', tableName: 'tb_films' });
  }
};
