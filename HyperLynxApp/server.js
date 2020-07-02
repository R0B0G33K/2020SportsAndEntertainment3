//Refrence Videos: https://www.youtube.com/playlist?list=PLD9SRxG6ST3GBsczn8OUKLaErhrvOz9zQ
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
const http = require('http');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const socketio = require('socket.io');

let app = express();
let server = http.createServer(app);
let io = socketio(server);


dotenv.config({ path: './.env'});



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
app.use(express.urlencoded({ extended: false}));
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

//define routes
app.use('/', require('./routes/pages.js'));

app.use('/auth', require('./routes/auth'));

//io connections
io.on('connection', (socket) =>{
    console.log('a user has connected');

    
    socket.on('disconnect', () =>{
        console.log('user was disconnected');
    });
});


//server info
const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
