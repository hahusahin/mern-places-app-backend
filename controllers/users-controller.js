const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const getAllUsers = async (req, res, next) => {
  let users = [];
  try {
    users = await User.find({}, "-password"); // excludes password
  } catch (error) {
    return next(
      new HttpError("Fetching users failed, please try again later", 500)
    );
  }

  res.json({ users });
};

const signUpUser = async (req, res, next) => {
  // apply server-side validation with express
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  //check whether the entered email is already in your db
  let hasUser;
  try {
    hasUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Signup failed, please try again later", 500));
  }

  if (hasUser) {
    return next(
      new HttpError("Email already exists, couldn't create user", 422)
    );
  }

  // encrypt the password and store the hashed password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("Signup failed, please try again later", 500));
  }

  // if no errors up to now, create the mongoose model and save
  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    imageUrl: req.file.path, // the attached file's path (/uploads/images/<imageId>)
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    return next(new HttpError("Signup failed, please try again later", 500));
  }

  // generate the json web token
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email }, // payload
      process.env.JWT_KEY, // secret key (no body knows except you)
      { expiresIn: "1h" } // options like expiration duration etc...
    );
  } catch (error) {
    return next(new HttpError("Signup failed, please try again later", 500));
  }

  // return the token in the response
  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  // find the user from the DB by looking at it's email
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Login failed, please try again later", 500));
  }
  // if couldn't find the user send error
  if (!identifiedUser) {
    return next(
      new HttpError("Invalid credentials, couldn't logged you in", 403)
    );
  }

  // compare the plain password with the hashed password stored in the DB using bcrypt
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (error) {
    return next(new HttpError("Login failed, please try again later", 500));
  }

  // if doesn't match, return error
  if (!isValidPassword) {
    return next(
      new HttpError("Invalid credentials, couldn't logged you in", 403)
    );
  }

  // generate the json web token
  let token;
  try {
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email }, // payload
      process.env.JWT_KEY, // secret key (no body knows except you)
      { expiresIn: "1h" } // options like expiration duration etc...
    );
  } catch (error) {
    return next(new HttpError("Login failed, please try again later", 500));
  }

  // return the token in the response
  res.json({
    userId: identifiedUser.id,
    email: identifiedUser.email,
    token: token,
  });
};

exports.getAllUsers = getAllUsers;
exports.signUpUser = signUpUser;
exports.loginUser = loginUser;
