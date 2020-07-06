const express = require('express');
const router = express.Router();

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
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/home', authenticationMiddleware(), (req, res) => {
    res.render('home.ejs');
});


function authenticationMiddleware () {  
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()) return next();
	    res.redirect('/login')
	}
}

//didnt know of a better way then repeating this... probably is sorry
function NOTauthenticationMiddleware () {  
	return (req, res, next) => {
        console.log('already signed in');
	    if (!(req.isAuthenticated())) return next();
	    res.redirect('/home')
	}
}

module.exports = router;