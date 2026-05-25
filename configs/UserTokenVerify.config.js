const JWT = require('jsonwebtoken');
module.exports = function(req, res, next){
    const token = req.header('token');
    if(!token) return res.status(401).json({error: 'Access Denied'});

    try{
        const verified = JWT.verify(token, process.env.USER_JWT_SECRET);
        req.user = verified;
        next();
    }catch(error){
        return res.status(403).json({error: 'Invalid Token'});
    }
}