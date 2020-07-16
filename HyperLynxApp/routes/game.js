const express = require('express');
const router = express.Router();
var bodyParser = require('body-parser')
const Sport = require('../models/sports');
const Match = require('../models/matches');
const Room = require('../models/rooms');
var crypto = require('crypto');

var orgs = ["error please refresh"];
var userElement;
var games = ["error please refresh"];
var gameData =["error please refresh"];

router.get('/',authenticationMiddleware(), async (req, res) => {
    req.session.touch();
    await Sport.aggregate('sport', 'DISTINCT', { plain: false })
        .then(sports => {
            orgs = ["error please refresh"];
            sports.forEach(fixFormat)
            //put into orgs
        })
        .catch(err => console.log(err));
        res.render('pick-sport.ejs',{type: 'game', sportsAv: orgs});
});



router.get('/:org',authenticationMiddleware(), async (req, res) => {
    userElement = req.params.org;
    if(!(orgs.some(checkMatching))){
        return res.redirect('/home/game');
    }
    await Match.findAll({
        raw: true,
        attributes: ['match','team1','team2'],
        where: {
            sport: req.params.org
        }
    })
    .then(matches =>{
        games = ["error please refresh"];
        gameData = ["error please refresh"];
        matches.forEach(makeArray);
        gameData = matches;
    })
    .catch(err => console.log(err));

    res.render('upcomingGames.ejs', {orgName: req.params.org, gameList: games, type: 'game'});
});

router.get('/:org/:match',authenticationMiddleware(),(req, res) => {
    userElement = req.params.org;
    if(!(orgs.some(checkMatching))){
        return res.redirect('/home/game');
    }
    
    userElement = req.params.match;
    if(!(games.some(checkMatching))){
        return res.redirect('/home/game')
    }
    res.render('create-game.ejs', {orgName: req.params.org, matchName: req.params.match, type: 'game'});
});

router.post('/:org/:match/createroom',authenticationMiddleware(), async (req, res) => {
    userElement = req.params.org;
    if(!(orgs.some(checkMatching))){
        return res.redirect('/home/game');
    }
    
    userElement = req.params.match;
    if(!(games.some(checkMatching))){
        return res.redirect('/home/game')
    }

    var tempRoomID = randomValueBase64();
    userElement = null;

    await Room.findAll({
        attributes: ['roomID'],
        where: {
            HostID: req.user.id,
            Org: req.params.org,
            Game: req.params.match,
        }
    })
    .then(rooms =>{
        if(rooms === undefined || rooms.length == 0){ 
            CreateRoom(tempRoomID,req.user.id,req.params.org,req.params.match);
            res.redirect('/room/'+tempRoomID.toString()+"");
        }
        else {
            console.log('Room Already Created')
        }
    })
    .catch(err => console.log(err));


});



router.post('/listMine',authenticationMiddleware(), async (req, res) => {

    await Room.findAll({
        raw: true,
        attributes: ['roomID', 'Game', 'HostID'],
        where: {
            HostID: req.user.id
        }
    })
    .then(rooms =>{
        if(rooms === undefined || rooms.length == 0){ 
            console.log('no rooms made yet')
        }
        else {
            res.render('roomList.ejs', {roomList: rooms})
        }
    })
    .catch(err => console.log(err));

});




router.post('/:org/:match/listAll',authenticationMiddleware(), async (req, res) => {
    userElement = req.params.org;
    if(!(orgs.some(checkMatching))){
        return res.redirect('/home/game');
    }
    
    userElement = req.params.match;
    if(!(games.some(checkMatching))){
        return res.redirect('/home/game')
    }

    userElement = null;

    await Room.findAll({
        raw: true,
        attributes: ['roomID', 'Game', 'HostID'],
        where: {
            Org: req.params.org,
            Game: req.params.match,
            Public: true
        }
    })
    .then(rooms =>{
        if(rooms === undefined || rooms.length == 0){ 
            console.log('no rooms for that specific game')
        }
        else {
            res.render('roomList.ejs', {roomList: rooms})
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

function checkMatching(element){
    return element == userElement;
}

function fixFormat(item,index){
    orgs[index] = item.DISTINCT;
}

function makeArray(item,index){
    games[index] = item.match;
}

function randomValueBase64(){
    return crypto
        .randomBytes(Math.ceil(12))
        .toString('base64')
        .slice(0,16)
        .replace(/\+/g, '0')
        .replace(/\//g, '0')
}

async function CreateRoom(tempRoomID, id, org, match){
    const newRoom = await Room.create({
        roomID: tempRoomID,
        HostID: id,
        Org: org,
        Game: match,
        Public: true,
        ExpireDate: '2020-12-28'
    });  
}

module.exports = router;