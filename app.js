const express = require('express')
const path = require('path');

const app = express()
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { createToken, validateToken } = require("./JWT")

const User = require("./models/Users");

mongoose.connect("mongodb+srv://langroopsadmin:" + process.env.MONGODB_PASSWORD + "@cluster0.tovje.mongodb.net/langroopsDB")

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());
// app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(cookieParser());


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

  app.post("/register", (req, res) => {
    const accountInfo = {
        email: req.body.values.email,
        password: req.body.values.password
    }
    console.log(accountInfo.email)
    User.findOne({ email: accountInfo.email }, function (err, result) {
        if (result === null) {
            bcrypt.hash(accountInfo.password, 10).then((hash) => {
                const newUser = new User({
                    email: accountInfo.email,
                    password: hash,
                    created_date: new Date(),
                    updated_date: new Date(),
                    role: "account"
                })

                newUser.save().then(() => {
                    console.log("User Registered")
                    const accessToken = createToken(newUser);
                    console.log(accessToken);
                    res.cookie("access-token", accessToken, {
                        maxAge: 30 * 24 * 60 * 60
                    })
                    res.send({
                        token: "test123"
                    })
                })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        }
        else {
            console.log("user exists")
            res.send("error: user exists")
        }
    }
    )

});


// ----------------------- LOGIN PAGE SERVER ------------------------------

//change to handle GET and POST differently

app.post("/login", async (req, res) => {
    const accountInfo = {
        email: req.body.values.email,
        password: req.body.values.password
    }
    console.log(accountInfo.email)
    const user = await User.findOne({ email: accountInfo.email })
    if (!user) {
        console.log("User doesn't exist")
    }
    else {
        const dbpassword = user.password;
        bcrypt.compare(accountInfo.password, dbpassword, function (err, result) {
            if (err) {
                console.log(err);// handle error
            }
            if (result) {
                const accessToken = createToken(user);
                console.log(accessToken);
                res.cookie("access-token", accessToken, {
                    maxAge: 30*24*60*60*100
                })

                res.send({
                    token: "test123"
                })
                // Send JWT
            } else {
                console.log()
                // response is OutgoingMessage object that server response http request
                console.log("Wrong Password")
            }
        });

    }
})








let port = process.env.PORT;
if (port == null || port == "") {
  port = 3001;
}
app.listen(port);