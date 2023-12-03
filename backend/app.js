import mongoose from "mongoose";

import { startBluetooth } from "./bluetooth.js";
import { startServer } from "./server.js";

// Connect to database
console.log("start connection to database...");
mongoose
  .connect("mongodb://localhost/battery", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to database"))
  .catch((error) => console.log(`database connection error: ${error}`));

// Start bluetooth
startBluetooth();

// Start server
startServer();
