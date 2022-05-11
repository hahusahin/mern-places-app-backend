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
    imageUrl: req.file.path,  // the attached file's path (/uploads/images/<imageId>)
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
      new HttpError("Invalid credentials, please check your email and password", 401)
    );
  }

  res.json({user: identifiedUser})
};

exports.getAllUsers = getAllUsers;
exports.signUpUser = signUpUser;
exports.loginUser = loginUser;
