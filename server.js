import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { BatterData } from "./mongoose.js";

const app = express();
const PORT = 3000;

export const startServer = () => {
  app.use(bodyParser.json());
  app.use(cors());

  app.get("/battery", async (req, res) => {
    const batteryQuery = BatterData.findOne().sort({ timestamp: -1 });
    const latestBattery = await batteryQuery.exec();

    res.json(latestBattery);
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};
