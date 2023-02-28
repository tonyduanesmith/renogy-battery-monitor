import noble from "@abandonware/noble";

const BT_DEVICE_NAME = "BT-TH-F258CF8C";
const INTERVAL = 1000;

noble.on("stateChange", (state) => {
  if (state === "poweredOn") {
    console.log("Bluetooth is on");
    initiateScan();
  } else {
    console.log("Bluetooth is off");
    noble.stopScanning();
  }
});

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
    if (peripheral.advertisement.localName == BT_DEVICE_NAME) {
      // connect to the peripheral
      peripheral.once("connect", () => {
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
      // connect to the peripheral
      await peripheral.connectAsync();
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
        let payload = Buffer.from(data);
        let numCells = payload.readInt16LE(4);
        let volts = [];
        for (let x = 1; x <= numCells; x++) {
          let volt = payload.readInt16LE(x * 2 + 4) / 10;
          volts.push(volt);
          console.log(volts.join(", "));
        }
        console.log("Received data");
      });
      // enable notifications
      await rx.notifyAsync(true);
      // write to the tx characteristic
      setInterval(() => {
        tx.writeAsync(
          Buffer.from([0x30, 0x03, 0x13, 0x88, 0x00, 0x11, 0x05, 0x49]),
          true
        );
      }, [INTERVAL]);
    }
  });
};
