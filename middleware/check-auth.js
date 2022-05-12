
const jwt = require("jsonwebtoken")
const HttpError = require("../models/http-error")

module.exports = (req, res, next) => {
  if(req.method === "OPTIONS"){
    return next()
  }
  try {
    // get the token from headers of the request
    const token = req.headers.authorization.split(" ")[1] // Authorization: 'Bearer Token'
    if(!token) throw new Error('Authentication failed')
    // check the token with secret key
    const decodedToken = jwt.verify(token, process.env.JWT_KEY)
    // bind the userId (which is returned when the token is created) to the request 
    req.userData = {userId: decodedToken.userId}
    // continue to routing
    next()
  } catch (err) {
    return next(new HttpError('Authentication failed', 403))
  }
}

