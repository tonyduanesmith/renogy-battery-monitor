import mongoose from "mongoose";

mongoose.connect("mongodb://localhost/battery", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const batteryDataSchema = new mongoose.Schema({
  batteryVoltage: Number,
  cellVoltages: [String],
  capacity: Number,
  current: Number,
  chargeLevel: Number,
  timestamp: Date,
});

export const BatterData = mongoose.model("BatteryData", batteryDataSchema);
