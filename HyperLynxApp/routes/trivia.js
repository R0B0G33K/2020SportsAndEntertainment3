const express = require('express');
const router = express.Router();
const mysql = require('mysql');
var bodyParser = require('body-parser')
const Sport = require('../models/sports');
const Data = require('../models/dataCollect');
const Question = require('../models/questions');

var orgs = ["error please refresh"];
var userElement;
var teams = ["error please refresh"];

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

router.get('/',authenticationMiddleware(), async (req, res) => {
    orgs =[];
    req.session.touch();
    await Sport.aggregate('sport', 'DISTINCT', { plain: false })
        .then(sports => {
            sports.forEach(fixFormat)
            //put into orgs
        })
        .catch(err => console.log(err));
        res.render('pick-sport.ejs',{type: 'trivia', sportsAv: orgs, user: req.user});
});


router.get('/submitAnswer',authenticationMiddleware(),(req, res) => {
    res.render('completedTrivia.ejs', {type: 'loser',user: req.user});
});

router.post('/submitAnswer',authenticationMiddleware(),(req, res) => {
    if(req.body.userAnswer == req.body.answer){
        req.user.points = (Number(req.user.points) + Number(req.body.worth));
        updateDB(req.user);
        res.render('completedTrivia.ejs', {type: 'winner', prize: req.body.worth,user: req.user});
    }
    else{
        res.render('completedTrivia.ejs', {type: 'loser',user: req.user});
    }
});


router.get('/:org',authenticationMiddleware(), async (req, res) => {
    teams = [];
    userElement = req.params.org;
    if(!(orgs.some(checkMatching))){
        return res.redirect('/home/trivia')
    }
    await Sport.findAll({
        raw: true,
        attributes: ['team'],
        where: {
            sport: req.params.org
        }
    })
    .then(teams => {
        teams.forEach(makeArray);
        //put into teams
    })
    .catch(err => console.log(err));

    res.render('teams.ejs', {orgName: req.params.org, teamList: teams, type: 'trivia',user: req.user});
});


router.get('/:org/:team',authenticationMiddleware(),async (req, res) => {
    userElement = req.params.org;
    if(!(orgs.some(checkMatching))){
        return res.redirect('/home/trivia');
    }
    
    userElement = req.params.team;
    if(!(teams.some(checkMatching))){
        return res.redirect('/home/trivia')
    }

    await Data.increment({visitTrivia: 1}, {where: {id: 0}});

    var chosenQuestion = {};
    await Question.findAll({
		raw: true,
        where: {
			OrgName: req.params.org,
			TeamName: req.params.team
        }
    })
    .then(teamQuestions =>{
        if(teamQuestions.length == 1){
            chosenQuestion = teamQuestions[0];
        }
        else{
            chosenQuestion = teamQuestions[Math.floor(Math.random() * teamQuestions.length)];
        }
        res.render('triviaQ.ejs', {orgName: req.params.org, teamName: req.params.team, type: 'trivia', question: chosenQuestion,user: req.user});
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
    teams[index] = item.team;
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

module.exports = router;