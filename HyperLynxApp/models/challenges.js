const Sequelize = require('sequelize');
const db = require('../config/database');

module.exports = db.define(
    'challenges',{
        roomID: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        bettingID:{
            type: Sequelize.STRING,
            primaryKey: true
        },
        userID:{
            type: Sequelize.STRING,
            primaryKey: true           
        },
        userName:{
            type: Sequelize.STRING,         
        },
        wager:{
            type: Sequelize.INTEGER,          
        },
        type:{
            type: Sequelize.STRING,
        },
        bet:{
            type: Sequelize.STRING,
        },
    },
    {
        timestamps: false
    }
);