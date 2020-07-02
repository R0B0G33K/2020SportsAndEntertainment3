const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.register = (req,res) => {

    const {name, username, email, password, passwordConfirm, points} = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if(error){
            console.log(error);
            return;
        }

        if (results.length >0){
            return res.status(400).render('register.ejs', {
                message: 'That email is already in use'
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
            points: points }, (error, results) =>{
                if(error){
                    console.log(error);
                }else{
                    console.log('User Registered');
                    return res.render('register.ejs', {
                        message: 'User Registered'
                    });     
                }
            });
    });
}

exports.login = async (req, res) =>{
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).render('login.ejs', {
                message: 'Please provide an email and password'
            });
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) =>{
            if(results.length<1 || !(await bcrypt.compare(password, results[0].password))){
                return res.status(400).render('login.ejs', {
                    message: 'The Email or Password is incorrect'
                }); 
            } else{
                const id = results[0].id;

                const token = jwt.sign({id}, process.env.JWT_SECRET,{
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES *24 * 60 * 60
                    ),
                    httpOnly: true
                }

                res.cookie('cookieMonster', token, cookieOptions);
                res.status(200).redirect("/home");
            }
        });

    } catch(error){
        console.log(error);
    }
}