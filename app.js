const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Couldn't find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unexpected error occured!" });
});

mongoose
  .connect("mongodb+srv://admin-hhs:Hs337515@cluster0.kojcq.mongodb.net/mernPlacesDB?retryWrites=true&w=majority")
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
