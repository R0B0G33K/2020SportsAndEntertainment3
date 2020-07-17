const Sequelize = require('sequelize');
const db = require('../config/database');

module.exports = db.define(
    'rooms',{
        roomID: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        HostID:{
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        Org:{
            type: Sequelize.STRING,
            primaryKey: true           
        },
        Game:{
            type: Sequelize.STRING,
            primaryKey: true            
        },
        Public:{
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        ExpireDate:{
            type: Sequelize.DATE,
            allowNull: false
        },
        username:{
            type: Sequelize.STRING        
        }
    },
    {
        timestamps: false
    }
);