const Room = require('../models/rooms');
const Challenge = require('../models/challenges');
const Match = require('../models/matches');
const mysql = require('mysql');
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

module.exports = {
    endMatches: async (killMatch) =>{
        let results =await Match.destroy({
            where: {
                date: killMatch
            }
        })
        .then(results =>{
            return results;
        });
        return results;
    },
    doResultStuff: async(roomToRuin) =>{
        let results = await Challenge.aggregate('bettingID', 'DISTINCT', { plain: false, raw: true, where:{roomID: roomToRuin}})
			.then(async ids => {
                if(ids === undefined || ids.length == 0){
                    await Room.destroy({
                        where: {
                            roomID: roomToRuin
                        }
                    });
                }
                else{
                    for(let i = 0; i < ids.length; i++){
                        await Challenge.findAll({
                            raw: true,
                            attributes: ['userID', 'wager','bet'],
                            where: {
                                bettingID: ids[i].DISTINCT,
                            }
                        })
                        .then(allBets =>{
                            var winners =[];
                            var pool = Number(allBets[0].wager) * allBets.length;
                            for(let j = 0; j < allBets.length; j++){
                                if(allBets[j].bet == 'win'){
                                    winners.push(allBets[j])
                                }
                            }
                            if(winners !== undefined || winners.length > 0){
                                var winnings = Math.floor(pool/winners.length);
                                for(let j = 0; j < winners.length; j++){
                                    db.query('UPDATE users SET points = points + ? WHERE id = ?', 
                                    [winnings , winners[j].userID], (error, results) =>{
                                        if(error){
                                            console.log(error);
                                        }else{
                                            console.log(results);
                                        }
                                    });
                                }
                            }
                        })
                        .catch(err => console.log(err));	
                    }
                    await Room.destroy({
                        where: {
                            roomID: roomToRuin
                        }
                    });
                    await Challenge.destroy({
                        where: {
                            roomID: roomToRuin,
                        }
                    });
                }
                var results = "complete";
                return results;
            })
            .catch(err => console.log(err));

            return results;
    }, 
    lockRoom: async(roomToLock) =>{
        let results = await Room.update(
            {locked: true},{
            where:{
                roomID: roomToLock
            }
        })
        .then(data =>{
            return data;
        })
        .catch(err => console.log(err));
        return results;
    },
    getInfo: async () =>{
        let results = await Room.findAll({
            raw: true,
            attributes: ['roomID','ExpireDate']
        })
        .then(matches =>{
            console.log(matches);
            return matches;
        })
        .catch(err => console.log(err));
        return results;
    }
}