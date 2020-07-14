const Sequelize = require('sequelize');
const db = require('../config/database');

module.exports = db.define(
    'sports',{
        team: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        sport:{
            type: Sequelize.STRING,
            primaryKey: true
        }
    },
    {
        timestamps: false
    }
);
