const { Schema, model, Types } = require("mongoose");

const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: Types.ObjectId, ref: "User", required: true },
});

placeSchema.set("toJSON", { getters: true });

module.exports = model("Place", placeSchema);
