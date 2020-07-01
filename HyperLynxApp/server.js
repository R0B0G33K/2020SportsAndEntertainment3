const express = require('express');
const mysql = require('mysql');

const app = express();

const db =mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodejs-hyper'
});

db.connect((error) =>{
    if(error){
        console.log(error)
    }else{
        console.log("MySQL Connected...")
    }
});


app.set('view-engine', 'ejs');

app.get('/',(req,res) =>{
    res.render('index.ejs')
});

const PORT = 3000 || process.env.PORT;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
