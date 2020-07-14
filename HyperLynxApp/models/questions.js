const Sequelize = require('sequelize');
const db = require('../config/database');

module.exports = db.define(
    'questions',{
        Question:{
            type: Sequelize.STRING,
            primaryKey: true
        },
        OrgName:{
            type: Sequelize.STRING,
            primaryKey: true           
        },
        TeamName:{
            type: Sequelize.STRING,
            primaryKey: true            
        },
        Worth:{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        AnswerIndex:{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        A1:{
            type: Sequelize.STRING
        },
        A2:{
            type: Sequelize.STRING
        },
        A3:{
            type: Sequelize.STRING
        },
        A4:{
            type: Sequelize.STRING
        }
    },
    {
        timestamps: false
    }
);