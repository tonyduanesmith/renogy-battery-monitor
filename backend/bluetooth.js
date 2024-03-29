import noble from "@abandonware/noble";
import { BatterData } from "./mongoose.js";

const BT_DEVICE_NAME = "BT-TH-F258CF8C";
const MAC_ADDRESS = "f0:f8:f2:58:cf:8c";
const INTERVAL = 30000;

let requestType;
let peripheralFound = false;


export const startBluetooth = () => {
  noble.on("stateChange", (state) => {
    if (state === "poweredOn") {
      noble.reset();
      console.log("Bluetooth is on");
      initiateScan();
    } else {
      console.log("Bluetooth is off");
      noble.stopScanning();
    }
  });
};

const initiateScan = () => {
  noble.startScanning([], true);

  noble.on("scanStart", () => {
    console.log("Scanning for BLE peripherals...");
  });

  noble.on("scanStop", () => {
    console.log("Scan stopped");
  });

  noble.on("warning", (message) => {
    console.log("Warning:", message);
  });

  noble.on("discover", async (peripheral) => {
    console.log(peripheral?.advertisement?.localName,peripheral?.address, "peripheral")
    if (
    (peripheral?.advertisement?.localName?.trim() == BT_DEVICE_NAME &&
      peripheralFound === false) || (peripheral?.address?.trim() == MAC_ADDRESS && peripheralFound === false)
    ) {
      peripheralFound = true;
      console.log("Found peripheral:", peripheral.advertisement.localName);
      // connect to the peripheral
      peripheral.once("connect", (error) => {
        console.log(
          "Connected to peripheral:",
          peripheral.advertisement.localName
        );
      });
      // disconnect from the peripheral
      peripheral.once("disconnect", () => {
        console.log(
          "Disconnected from peripheral:",
          peripheral.advertisement.localName
        );
      });
      // stop scanning
      await noble.stopScanningAsync();
      noble.reset();
      // connect to the peripheral
      await peripheral.connectAsync().catch((error) => {
        console.log(error);
      });
      // discover the services and characteristics of the peripheral
      const { characteristics } =
        await peripheral.discoverAllServicesAndCharacteristicsAsync([
          "fff0",
          "ffd0",
        ]);
      // find the characteristics we need
      const rx = characteristics.find((c) => c.uuid === "fff1");
      const tx = characteristics.find((c) => c.uuid === "ffd1");
      // subscribe to the rx characteristic
      rx.on("data", (data) => {
        switch (requestType) {
          case "cellVoltages":
            getCellVoltagesResponse(data);
            break;
          case "levels":
            getLevelsResponse(data);
          default:
            console.log("Unknown request type");
        }
        console.log("Received data...");
      });
      // enable notifications
      await rx.notifyAsync(true);

      // send the request
      while (true) {
        await getLevelsRequest(tx);
        await wait(INTERVAL);
        await getCellVoltagesRequest(tx);
        await wait(INTERVAL);
      }
    }
  });
};

export const getCellVoltagesRequest = async (tx) => {
  await tx.writeAsync(
    Buffer.from([0x30, 0x03, 0x13, 0x88, 0x00, 0x11, 0x05, 0x49]),
    true
  );

  requestType = "cellVoltages";
};

export const getCellVoltagesResponse = (data) => {
  let payload = Buffer.from(data);
  let numCells = payload.readInt16LE(4);
  let volts = [];
  for (let x = 1; x <= numCells; x++) {
    let volt = payload.readInt16LE(x * 2 + 4) / 10;
    volts.push(volt);
  }
  console.log(volts.join(", "));
};

export const getLevelsRequest = async (tx) => {
  await tx.writeAsync(
    Buffer.from([0x30, 0x03, 0x13, 0xb2, 0x00, 0x06, 0x65, 0x4a]),
    true
  );

  requestType = "levels";
};

export const getLevelsResponse = (data) => {
  let payload = Buffer.from(data);
  console.log(payload);
  let current = payload.readInt16BE(3) / 100;
  console.log({ current });
  let volt = payload.readUInt16LE(6) / 10;
  console.log({ volt });
  let chargeLevel = payload.readUInt32BE(7) / 1000;
  console.log({ chargeLevel });
  let capacity = payload.readUInt32BE(11) / 1000;
  console.log({ capacity });
  let timestamp = new Date();



  const batteryData = new BatterData({
    batteryVoltage: volt,
    cellVoltages: [],
    capacity: capacity,
    current: current,
    chargeLevel: chargeLevel,
    timestamp: timestamp,
  });

  batteryData
    .save()
    .then((savedData) => {
      console.log("Data saved");
    })
    .catch((err) => {
      console.log(err);
    });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
