import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl, {
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
