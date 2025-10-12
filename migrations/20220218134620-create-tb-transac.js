'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS "cinema_online";');
    await queryInterface.createTable({ schema: 'cinema_online', tableName: 'tb_transacs' }, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      iduser: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: { schema: 'cinema_online', tableName: 'tb_users' },
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      idFilm: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: { schema: 'cinema_online', tableName: 'tb_films' },
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      buktiTF: {
        allowNull: false,
        type: Sequelize.STRING
      },
      accountNum: {
        allowNull: false,
        type: Sequelize.STRING
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'Pending'
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
    await queryInterface.dropTable({ schema: 'cinema_online', tableName: 'tb_transacs' });
  }
};
