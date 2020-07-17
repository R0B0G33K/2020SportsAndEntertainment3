const express = require('express');
const router = express.Router();
const mysql = require('mysql');
var bodyParser = require('body-parser')

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

router.get('/',(req, res) => {
    res.render('index.ejs');
});

router.get('/register',NOTauthenticationMiddleware(),(req, res) => {
    res.render('register.ejs', {message: false});
});

router.get('/login', NOTauthenticationMiddleware(), (req, res) => {
    res.render('login.ejs', {message: false});
});

router.get('/logout', authenticationMiddleware(), (req, res) => {
    console.log('log out');
    updateDB(req.user);
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/home', authenticationMiddleware(), async (req, res) => { 
	req.session.touch();
    await db.query('SELECT * FROM users WHERE id = ?', 
	[req.user.id], (error, results) =>{
		if(error){
			console.log(error);
		}else{
            console.log( results[0].points);
            req.user.points = results[0].points;
            res.render('home.ejs', {user: req.user});
		}
	});
});

router.get('/back',authenticationMiddleware(),(req, res) => {
    res.redirect('/home');
});

function authenticationMiddleware () {  
	return (req, res, next) => {

	    if (req.isAuthenticated()) return next();
	    res.redirect('/login')
	}
}

//didnt know of a better way then repeating this... probably is sorry
function NOTauthenticationMiddleware () {  
	return (req, res, next) => {
        if (!(req.isAuthenticated())) return next();
	    res.redirect('/home')
	}
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

module.exports = router;