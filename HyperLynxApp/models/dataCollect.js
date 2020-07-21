const Sequelize = require('sequelize');
const db = require('../config/database');

module.exports = db.define(
    'data',{
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true         
        },
        facebook:{
            type: Sequelize.INTEGER,
        },
        reddit:{
            type: Sequelize.INTEGER,
        },
        tumbler:{
            type: Sequelize.INTEGER,
        },
        twitter:{
            type: Sequelize.INTEGER,
        },
        instagram:{
            type: Sequelize.INTEGER,
        },
        visitAbout:{
            type: Sequelize.INTEGER,
        },
        visitTrivia:{
            type: Sequelize.INTEGER,
        },
        createRoom:{
            type: Sequelize.INTEGER,
        },
        joinRoom:{
            type: Sequelize.INTEGER,
        },
    },
    {
        timestamps: false
    }
);