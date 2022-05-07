const axios = require("axios");

const API_KEY = "";

const getCoordsForAddress = async (address) => {
  // const url = ``;
  // const response = await axios.get(url)
  // const data = response.data

  return {
    lat: 40.7484405,
    lng: -73.9878584,
  };
};

module.exports = getCoordsForAddress;
