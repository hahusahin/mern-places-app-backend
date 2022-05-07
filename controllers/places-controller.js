const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Place = require("../models/place");
const User = require("../models/user");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError(
        "Something went wrong, couldn't find the place in the database",
        500
      )
    );
  }

  if (!place) {
    return next(
      new HttpError("Couldn't find a place for the provided id", 404)
    );
  }

  res.json({ place }); //.toObject({ getters: true })
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places = [];
  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(
      new HttpError("Fetching places failed, please try again later", 500)
    );
  }

  if (places.length === 0) {
    return next(
      new HttpError("Couldn't find a place for the provided user id", 404)
    );
  }

  res.json({ places });
};

const createPlace = async (req, res, next) => {
  //apply express validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }
  // continue if no errors occur
  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address); // TODO: Apply google geocoding api
  } catch (error) {
    return next(error);
  }

  // create new Mongoose Place Model instance
  const newPlace = new Place({
    title,
    description,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
    address,
    location: coordinates,
    creator,
  });

  // check whether the user who creates the place exists in DB
  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(
      new HttpError("Creating place failed, please try again later", 500)
    );
  }

  if (!user) {
    return next(new HttpError("Couldn't find the user for provided id", 404));
  }

  // Save the place (Places Collection) && Add the placeId to the user who created (User Collection)
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // add the newly created place to DB (places collection)
    await newPlace.save({ session: sess });
    // add the new place (it's id) to the user's places field (not an array push) 
    user.places.push(newPlace);
    // save the updated user in the DB (users collection)
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(
      new HttpError("Creating place failed, please try again later", 500)
    );
  }

  res.status(201).json({ place: newPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;
  // fetch the place that needs to be updated
  let foundPlace;
  try {
    foundPlace = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError(
        "Something went wrong, couldn't find the place in the database",
        500
      )
    );
  }
  // update the place object
  foundPlace.title = title;
  foundPlace.description = description;

  // save the updated object
  try {
    await foundPlace.save();
  } catch (error) {
    return next(
      new HttpError("Something went wrong, couldn't update place", 500)
    );
  }

  res.status(200).json({ place: foundPlace });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  // find the place to be deleted
  let foundPlace;
  try {
    foundPlace = await Place.findById(placeId).populate('creator');
  } catch (error) {
    return next(new HttpError("Couldn't find a place to be deleted", 500));
  }

  if(!foundPlace){
    return next(new HttpError("Couldn't find the place for provided id", 404));
  }

  // delete the place from Places Collection && delete the place id from user.places field
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // remove the place with placeId from DB
    await foundPlace.remove({ session: sess }); 
    // find the User who added this place and delete it from his places
    foundPlace.creator.places.pull(foundPlace)
    // save the updated User document
    await foundPlace.creator.save({ session: sess }); 
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Couldn't delete the place", 500));
  }

  res.status(200).json({ message: "Deleted Succesfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
