import mongoose from "mongoose";
import dotenv from "dotenv";

import { startBluetooth } from "./bluetooth.js";
import { startServer } from "./server.js";

dotenv.config();

const dbUrl = process.env.DB_URL;

// Connect to database
console.log("start connection to database...", typeof dbUrl);
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to database"))
  .catch((error) => console.log(`database connection error: ${error}`));

// Start bluetooth
startBluetooth();

// Start server
startServer();
