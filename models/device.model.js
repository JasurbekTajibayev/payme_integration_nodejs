const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const deviceSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

module.exports = model("payme_device", deviceSchema);
