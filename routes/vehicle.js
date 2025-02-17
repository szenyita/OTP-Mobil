const express = require("express");
const router = express.Router();
const Vehicle = require("../models/vehicle");

router.use(express.json());

// 1. Adding a new vehicle to the fleet.
router.post("/", async (req, res) => {
  const validFuelTypes = ["gasoline", "mild hybrid", "pure electric"];

  try {
    const { passengerCapacity, range, fuel } = req.body;

    if (!passengerCapacity || !range || !fuel) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!validFuelTypes.includes(fuel)) {
      return res.status(400).json({
        message: `Invalid fuel type. Allowed values: ${validFuelTypes.join(
          ", "
        )}`,
      });
    }

    const newVehicle = new Vehicle({ passengerCapacity, range, fuel });
    await newVehicle.save();

    res
      .status(201)
      .json({ message: "Vehicle added successfully", vehicle: newVehicle });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding vehicle", error: error.message });
  }
});

module.exports = router;
