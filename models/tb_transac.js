'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tb_transac extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tb_transac.belongsTo(models.tb_films, {
        as: 'film',
        foreignKey: {
          name: 'idFilm'
        }
      })

      tb_transac.belongsTo(models.tb_users, {
        as: 'user',
        foreignKey: {
          name: 'iduser'
        }
      })

    }
  }
  tb_transac.init({
    iduser: DataTypes.INTEGER,
    idFilm: DataTypes.INTEGER,
    buktiTF: DataTypes.STRING,
    accountNum: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'tb_transac',
  });
  return tb_transac;
};