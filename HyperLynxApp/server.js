//Refrence Videos: https://www.youtube.com/playlist?list=PLD9SRxG6ST3GBsczn8OUKLaErhrvOz9zQ
//also used chris courses
//VS Code installed extensions
/*
EJS language support
ES Lint
HTML CSS support
PHP Debug
PHP extension pack
PHP IntelliSense
*/
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
//Authentication Packages
const session = require('express-session');
const passport = require('passport');
const MySQLStore = require('express-mysql-session')(session); 
//Sequelize DB
const sequelize = require('./config/database')

let app = express();

dotenv.config({ path: './.env'});


sequelize.authenticate()
    .then(() => console.log('Database Connected to Sequelize...'))
    .catch(err => console.log('Error: ' + err));

//made a mysql databse for login first. So ONLY authentication uses this
const db =mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

//parse URL encoded bodies
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(cookieParser());


app.set('view-engine', 'ejs');

db.connect((error) =>{
    if(error){
        console.log(error)
    }else{
        console.log("MySQL Connected...")
    }
});

var options = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000
};

var sessionStore = new MySQLStore(options);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    store:sessionStore,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//define routes
app.use('/', require('./routes/pages.js'));

app.use('/auth', require('./routes/auth'));

app.use('/home/game', require('./routes/game'));

app.use('/home/trivia', require('./routes/trivia'));

app.use('/room', require('./routes/rooms'));


//server info
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
