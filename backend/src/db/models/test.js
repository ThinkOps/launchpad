const { DataTypes } = require('sequelize');
const AppDataSource = require('../dataSource'); 

const test = AppDataSource.define('test', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(100),
    allowNullL: false,
    unique: true
  }
}, {
  tableName: 'Test',
  timestamps: true,
});

module.exports = test;
