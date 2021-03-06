const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const standardPoints = 100;

exports.register = (req,res) => {

    const {name, username, email, password, passwordConfirm} = req.body;

    db.query('SELECT email FROM users WHERE email = ? OR username = ?', [email, username], async (error, results) => {
        if(error){
            console.log(error);
            return;
        }

        if (results.length >0){
            return res.status(400).render('register.ejs', {
                message: 'That email / screen name is already in use'
            });
        }
        else if(password !== passwordConfirm){
            return res.status(400).render('register.ejs', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);

        db.query('INSERT INTO users SET ?', {
            name: name,
            username: username, 
            email: email, 
            password: hashedPassword, 
            points: standardPoints }, (error, results) =>{
                if(error){
                    console.log(error);
                }else{
                    console.log('User Registered');
                    //may be causing error in login
                    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) =>{
                        if(results === undefined|| results.length<1 || !(await bcrypt.compare(password, results[0].password))){
                            return res.status(400).render('login.ejs', {
                                message: 'Error'
                            }); 
                        } else{
                            const user_iid = results[0];
                            req.login(user_iid, function(err) {
                                res.status(200).redirect("/home");
                            });
                        }
                    });  
                }
            });
    });
};

exports.login = async (req, res) =>{
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).render('login.ejs', {
                message: 'Please provide an email and password'
            });
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) =>{
            if(results === undefined|| results.length<1 || !(await bcrypt.compare(password, results[0].password))){
                return res.status(400).render('login.ejs', {
                    message: 'The Email or Password is incorrect'
                }); 
            } else{
                const user_id = results[0];
                req.login(user_id, function(err) {
                    res.status(200).redirect("/home");
                });
            }
        });

    } catch(error){
        console.log(error);
    }
};

passport.serializeUser(function(user_id ,done){
    done(null, user_id)
});

passport.deserializeUser(function(user_id ,done){
    done(null, user_id)
});