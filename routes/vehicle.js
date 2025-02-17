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

// 2. Provide a suggestion for assigning vehicles to a trip.
router.get("/", async (req, res) => {
  const city_range = 50;
  const km_fee = 2;
  const half_hour_fee = 2;
  const gasoline_refuel_cost = 2;
  const electric_refuel_cost = 1;

  try {
    const { passengers, distance } = req.query;
    const numPassengers = parseInt(passengers);
    const tripDistance = parseFloat(distance);

    if (!numPassengers || !tripDistance) {
      return res.status(400).json({
        message: "Please provide valid passenger and distance values.",
      });
    }

    const vehicles = await Vehicle.find({
      passengerCapacity: { $gte: numPassengers },
      range: { $gte: tripDistance },
    });

    if (vehicles.length === 0) {
      return res
        .status(404)
        .json({ message: "No suitable vehicles found for this trip." });
    }

    const tripOptions = vehicles.map((vehicle) => {
      let timeInMinutes;

      if (tripDistance < city_range) {
        timeInMinutes = tripDistance * 2;
      } else {
        timeInMinutes = city_range * 2 + (tripDistance - city_range);
      }

      const travelFee =
        tripDistance * km_fee * numPassengers +
        Math.ceil(timeInMinutes / 30) * half_hour_fee;

      let refuelCost;
      if (vehicle.fuel === "gasoline") {
        refuelCost = tripDistance * gasoline_refuel_cost;
      } else if (vehicle.fuel === "pure electric") {
        refuelCost = tripDistance * electric_refuel_cost;
      } else if (vehicle.fuel === "mild hybrid") {
        let cityDistance = Math.min(tripDistance, city_range);
        let highwayDistance = Math.max(0, tripDistance - city_range);

        let actualRangeUsed = cityDistance / 2 + highwayDistance;
        refuelCost = actualRangeUsed * gasoline_refuel_cost;
      }

      const profit = travelFee - refuelCost;

      return {
        vehicleId: vehicle._id,
        passengerCapacity: vehicle.passengerCapacity,
        fuel: vehicle.fuel,
        range: vehicle.range,
        travelFee,
        refuelCost,
        profit,
      };
    });

    tripOptions.sort((a, b) => b.profit - a.profit);
    res.status(200).json(tripOptions);
  } catch (error) {
    res.status(500).json({
      message: "Error calculating trip suggestions",
      error: error.message,
    });
  }
});

module.exports = router;
