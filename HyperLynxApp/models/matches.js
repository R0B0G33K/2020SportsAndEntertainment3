const Sequelize = require('sequelize');
const db = require('../config/database');

module.exports = db.define(
    'matches',{
        sport: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        match:{
            type: Sequelize.STRING,
            primaryKey: true
        },
        date:{
            type: Sequelize.DATE
        }
    },
    {
        timestamps: false
    }
);