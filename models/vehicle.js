const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  passengerCapacity: { type: Number, required: true },
  range: { type: Number, required: true },
  fuel: {
    type: String,
    enum: ["gasoline", "mild hybrid", "pure electric"],
    required: true,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
