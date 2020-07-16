const express = require('express');
const router = express.Router();
const mysql = require('mysql');
var bodyParser = require('body-parser')
const Challenge = require('../models/challenges');
const Room = require('../models/rooms');
var crypto = require('crypto');

var roomChallenges =[];
var uniqueBetID = [];


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});




router.post('/:roomID/:betID/joinBet',authenticationMiddleware(), async (req, res) => {
	await Challenge.findAll({
		raw: true,
        where: {
			roomID: req.params.roomID,
			bettingID: req.params.betID,
			userID: req.user.id
        }
    })
    .then(async check =>{
		if(check === undefined || check.length == 0){

			req.user.points = (req.user.points - req.body.wager);
			updateDB(req.user);
			const newChallenge = await Challenge.create({
				roomID: req.params.roomID,
				bettingID: req.params.betID,
				userID: req.user.id,
				userName: req.user.username,
				wager: req.body.wager,
				type: req.body.type,
				bet: req.body.bet
			});  
			res.redirect('/room/'+req.params.roomID+"");

		}
		else{
			console.log('user already there');
		}
    })
	.catch(err => console.log(err));	
});



router.post('/:roomID/postChallenge',authenticationMiddleware(), async (req, res) => {
	var tempBetID = randomValueBase64();
	req.user.points = (req.user.points - req.body.wager);
	updateDB(req.user);
	const newChallenge = await Challenge.create({
        roomID: req.params.roomID,
        bettingID: tempBetID,
		userID: req.user.id,
		userName: req.user.username,
		wager: req.body.wager,
		type: req.body.challenge,
		bet: req.body.bet
    });  
    res.redirect('/room/'+req.params.roomID+"");
});

router.post('/delete',authenticationMiddleware(), async (req, res) => {

	var roomid = [];

	await Room.findAll({
		raw: true,
        attributes: ['roomID'],
        where: {
			HostID: req.body.HostID,
			Org: req.body.Org,
			Game: req.body.Game,
        }
    })
    .then(rooms =>{
		roomid = rooms[0].roomID;
    })
	.catch(err => console.log(err));


	await Challenge.findAll({
		raw: true,
        attributes: ['userID', 'wager'],
        where: {
			roomID: roomid,
        }
    })
    .then(refundBet =>{
		if(!(refundBet === undefined) || rooms.length > 0){
			for(var i=0, len = refundBet.length; i < len; i++){
				fixfunds(refundBet[i]);
			}
		}
    })
	.catch(err => console.log(err));	

    await Room.destroy({
        where: {
			HostID: req.body.HostID,
			Org: req.body.Org,
			Game: req.body.Game,
        }
	})
	await Challenge.destroy({
        where: {
			roomID: roomid,
        }
	})
	res.redirect('/home');
});

router.get('/:roomID', authenticationMiddleware(), async (req, res) => {
	req.session.touch();
	uniqueBetID = [];

	await Challenge.findAll({
		raw: true,
        attributes: ['bettingID', 'userID', 'userName', 'wager', 'type','bet'],
        where: {
            roomID: req.params.roomID
        }
    })
    .then(async challenges =>{
		if(challenges == null || challenges.length > 0){
			challenges.forEach(makeArray);

			await Challenge.aggregate('bettingID', 'DISTINCT', { plain: false, raw: true, where:{roomID: req.params.roomID}})
			.then(ids => {
				ids.forEach(fixFormat)
				//put into list of ids
			})
			.catch(err => console.log(err));
		}
    })
	.catch(err => console.log(err));



	
	await Room.findAll({
		raw: true,
        attributes: ['HostID', 'Org', 'Game', 'Public'],
        where: {
            roomID: req.params.roomID
        }
    })
    .then(rooms =>{
        if(rooms === undefined || rooms.length == 0){ 
			res.redirect('/home');
        }
        else if(rooms.length == 1) {
			console.log('room Challenges');
            res.render('room.ejs', {HostID: rooms[0].HostID, user: req.user, Org: rooms[0].Org, Game: rooms[0].Game, status: rooms[0].Public, roomID: req.params.roomID, listOfBets: roomChallenges, listOfBetID: uniqueBetID});
		}
		else{
			console.log('Multiple Room Same ID ERROR');
		}
    })
	.catch(err => console.log(err));
	
});

function authenticationMiddleware () {  
	return (req, res, next) => {

	    if (req.isAuthenticated()) return next();
	    res.redirect('/login')
	}
}

function fixfunds(unfixedUser){
	db.query('UPDATE users SET points = points + ? WHERE id = ?', 
	[unfixedUser.wager, unfixedUser.userID], (error, results) =>{
		if(error){
			console.log(error);
		}else{
			console.log(results);
		}
	});
}

function updateDB(unfixedUser){
	db.query('UPDATE users SET points = ? WHERE id = ?', 
	[unfixedUser.points, unfixedUser.id], (error, results) =>{
		if(error){
			console.log(error);
		}else{
			console.log(results);
		}
	});
}

function fixFormat(item,index){
    uniqueBetID[index] = item.DISTINCT;
}

function makeArray(item,index){
    roomChallenges[index] = item;
}

function randomValueBase64(){
    return crypto
        .randomBytes(Math.ceil(12))
        .toString('base64')
        .slice(0,16)
        .replace(/\+/g, '0')
        .replace(/\//g, '0')
}

module.exports = router;