const express = require('express');
const router = express.Router();
const mysql = require('mysql');
var bodyParser = require('body-parser')
const Challenge = require('../models/challenges');
const Match = require('../models/matches');
const Room = require('../models/rooms');
var crypto = require('crypto');

var roomChallenges =[];
var uniqueBetID = [];
var userElement;


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


router.post('/:roomID/:betID/cancelBet',authenticationMiddleware(), async (req, res) => {
	await Challenge.findAll({
		raw: true,
        where: {
			roomID: req.params.roomID,
			bettingID: req.params.betID,
        }
    })
    .then(async indivBets =>{
		if(indivBets === undefined || indivBets.length == 0){
			req.flash('error', 'You are trying to cancel a challenge that does not exist!');
			res.redirect('/room/'+req.params.roomID+"");
		}
		else{	
			for(var i=0, len = indivBets.length; i < len; i++){
				fixfunds(indivBets[i]);
			}
			await Challenge.destroy({
				where: {
					roomID: req.params.roomID,
					bettingID: req.params.betID,
				}
			})
			res.redirect('/room/'+req.params.roomID+"");
		}
    })
	.catch(err => console.log(err));	
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
			if(req.user.points < req.body.wager){
				req.flash('error', 'You do not have enough points to join this challenge!');
				res.redirect('/room/'+req.params.roomID+"");
			}
			else{
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
		}
		else{
			console.log('user already there');
			req.flash('error', 'You are already in this challenge!');
			res.redirect('/room/'+req.params.roomID+"");
		}
    })
	.catch(err => console.log(err));	
});



router.post('/:roomID/postChallenge',authenticationMiddleware(), async (req, res) => {


	await Challenge.findAll({
		raw: true,
        attributes: ['bettingID', 'userID', 'userName', 'wager', 'type','bet'],
        where: {
            roomID: req.params.roomID
        }
    })
    .then(async challenges =>{
		userElement = req.body.challenge;
		if(challenges.some(checkMatchingType)){
			req.flash('error', 'You already have that type of bet in your room!');
			res.redirect('/room/'+req.params.roomID+"");
			userElement = "";
		}
		else{
			if(req.user.points < req.body.wager){
				req.flash('error', 'You do not have enough points to post that challenge!');
				res.redirect('/room/'+req.params.roomID+"");
				userElement = "";
			}
			else{
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
				userElement = "";
			}
		}
	})
	.catch(err => console.log(err));
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
		if(challenges != null || challenges.length > 0){
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
        attributes: ['HostID', 'Org', 'Game', 'Public','locked'],
        where: {
            roomID: req.params.roomID
        }
    })
    .then(async rooms =>{
        if(rooms === undefined || rooms.length == 0){ 
			res.redirect('/home');
        }
        else if(rooms.length == 1) {

			await Match.findAll({
				raw: true,
				attributes: ['team1','team2'],
				where: {
					match: rooms[0].Game
				}
			})
			.then(matches =>{
				res.render('room.ejs', {HostID: rooms[0].HostID, user: req.user, message: req.flash('error'), Org: rooms[0].Org, Game: rooms[0].Game, status: rooms[0].Public, roomID: req.params.roomID, listOfBets: roomChallenges, listOfBetID: uniqueBetID, teams: matches[0], locked: rooms[0].locked});
				roomChallenges =[];

			})
			.catch(err => console.log(err));
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
			return;
		}else{
			console.log(results);
			return;
		}
	});
}

function updateDB(unfixedUser){
	db.query('UPDATE users SET points = ? WHERE id = ?', 
	[unfixedUser.points, unfixedUser.id], (error, results) =>{
		if(error){
			console.log(error);
			return;
		}else{
			console.log(results);
			return;
		}
	});
}

function checkMatchingType(element){
    return element.type == userElement;
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