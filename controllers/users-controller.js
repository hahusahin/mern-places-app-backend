const { validationResult } = require("express-validator");

const User = require("../models/user")
const HttpError = require("../models/http-error");


const getAllUsers = async (req, res, next) => {
  let users = [];
  try {
    users = await User.find({}, '-password');
  } catch (error) {
    return next(
      new HttpError("Fetching users failed, please try again later", 500)
    );
  }

  res.json({ users });
};

const signUpUser = async (req, res, next) => {
  // apply server-side validation with express
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }
  
  const { name, email, password } = req.body;

  //check whether the entered email is already in your db
  let hasUser;
  try {
    hasUser = await User.findOne({ email: email })
  } catch (error) {
    return next(new HttpError("Signup failed, please try again later", 500))
  }
  
  if(hasUser){
    return next(new HttpError("Email already exists, couldn't create user", 422))
  }

  // if everything works fine, create the mongoose model and save
  const createdUser = new User({
    name,
    email,
    password,
    imageUrl: "https://res.cloudinary.com/academind-gmbh/image/upload/f_auto,q_auto:eco/dpr_2.0,w_120,c_lfill,g_center,h_120/v1/academind.com/site/max",
    places: []
  });
  
  try {
    await createdUser.save();
  } catch (error) {
    return next(
      new HttpError("Signup failed, please try again later", 500)
    );
  }

  res.status(201).json({ user: createdUser });
};

const loginUser = async (req, res, next) => {
  const {email, password} = req.body
  
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email })
  } catch (error) {
    return next(new HttpError("Login failed, please try again later", 500))
  }

  if(!identifiedUser || identifiedUser.password !== password){
    return next(
      new HttpError("Couldn't identify user, credentials may be wrong", 401)
    );
  }

  res.json({message: "Logged In"})
};

exports.getAllUsers = getAllUsers;
exports.signUpUser = signUpUser;
exports.loginUser = loginUser;
