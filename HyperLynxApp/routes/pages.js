const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
var bodyParser = require('body-parser')

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

router.get('/',NOTauthenticationMiddleware(),(req, res) => {
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


router.post('/updateInfo', async (req, res) => {
	var {username, email, name} = req.body;
	username = username.split(" ").join("");
	email = email.split(" ").join("");


	db.query('SELECT email FROM users WHERE NOT id = ? AND (email = ? OR username = ?)', [req.user.id,email, username], async (error, results) => {
        if(error){
            console.log(error);
            return;
        }
		console.log(results);
        if (results.length >0){
				console.log('either email or username is taken already')
				return;
		 }
		 
		 updateDBInfo(username, email, name, req.user.id);
		 
		 if(req.body.oldpassword != null && await bcrypt.compare(req.body.oldpassword, req.user.password)){
			 if((req.body.newpassword != null) && (req.body.newpassword == req.body.passwordConfirm)){
				 let hashedPassword = await bcrypt.hash(req.body.newpassword, 8);
				 updateDBPass(hashedPassword, req.user.id);
			 }
		 }
	});
	res.redirect('/home');
});


router.get('/home', authenticationMiddleware(), async (req, res) => { 
	req.session.touch();
	var curLeaders = [];

	await db.query('SELECT id, username, points FROM users ORDER BY points DESC Limit 10', (error,results) =>{
		if(error){
			console.log(error);
		}
		else{
			curLeaders = results;
		}
	});


    await db.query('SELECT * FROM users WHERE id = ?', 
	[req.user.id], (error, results) =>{
		if(error){
			console.log(error);
		}else{
            console.log( results[0].points);
			req.user.points = results[0].points;
			req.user.username = results[0].username;
			req.user.email = results[0].email;
			req.user.name = results[0].name;
			req.user.password = results[0].password;
            res.render('home.ejs', {user: req.user, curleader: curLeaders, message: req.flash('error')});
		}
	});
});

router.get('/about', (req, res) => {
	req.session.touch();
	if(req.user != undefined){
		res.render('about.ejs',{isUser: true, user: req.user});
	}
	else{
		res.render('about.ejs',{isUser: false});
	}

});

router.get('/account', authenticationMiddleware(), (req, res) => {
	req.session.touch();

	res.render('account.ejs',{user: req.user});

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

function updateDBInfo(username, email, name, userId){
	db.query('UPDATE users SET username = ?, email = ?, name = ?  WHERE id = ?', 
	[username, email, name, userId], (error, results) =>{
		if(error){
			console.log(error);
		}else{
			console.log(results);
		}
	});
}

function updateDBPass(password, userId){
	db.query('UPDATE users SET password = ?  WHERE id = ?', 
	[password, userId], (error, results) =>{
		if(error){
			console.log(error);
		}else{
			console.log(results);
		}
	});
}

module.exports = router;