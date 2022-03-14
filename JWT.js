const {sign, verify} = require("jsonwebtoken");

const createToken = (user) =>{
    const accessToken = sign(
        {id: user.id, 
        role: user.role},
        "secretkey"
    );

    return accessToken;
}

const validateToken = (req, res, next) =>{
    const accessToken = req.cookies["access-token"];
    // console.log(accessToken);
    if (!accessToken){
        console.log("User not authenticated")
    }

    try{
        const validToken = verify(accessToken, "secretkey");
        if (validToken){
            // console.log(validToken.role)
            req.auth = true;
            req.accessToken = validToken
            return next();
        }
    }
    catch(err){
        console.log(err)
    }
}

module.exports = {createToken, validateToken};