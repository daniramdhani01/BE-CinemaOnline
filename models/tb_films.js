'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tb_films extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tb_films.init({
    title: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    category: DataTypes.STRING,
    price: DataTypes.BIGINT,
    link: DataTypes.STRING,
    desc: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'tb_films',
  });
  return tb_films;
};