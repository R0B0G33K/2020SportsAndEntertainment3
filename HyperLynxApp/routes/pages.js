const express = require('express');

const router = express.Router();

router.get('/',(req, res) => {
    res.render('index.ejs');
});

router.get('/register',(req, res) => {
    res.render('register.ejs', {message: false});
});

router.get('/login',(req, res) => {
    res.render('login.ejs', {message: false});
});

router.get('/home',(req, res) => {
    res.render('home.ejs');
});


module.exports = router;