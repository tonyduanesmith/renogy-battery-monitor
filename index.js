import noble from "@abandonware/noble";

const BT_DEVICE_NAME = "BT-TH-F258CF8C";

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
  noble.startScanning([], true); // any service UUID, allow duplicates

  noble.on("scanStart", () => {
    console.log("Scanning for BLE peripherals...");
  });

  noble.on("scanStop", () => {
    console.log("Scan stopped");
  });

  noble.on("warning", (message) => {
    console.log("Warning:", message);
  });
};

noble.on("discover", (peripheral) => {
  peripheral.once("connect", () => {
    console.log("Connected to peripheral:", peripheral.advertisement.localName);
  });

  peripheral.once("disconnect", () => {
    console.log(
      "Disconnected from peripheral:",
      peripheral.advertisement.localName
    );
  });

  if (peripheral.advertisement.localName == BT_DEVICE_NAME) {
    console.log("Found peripheral:", peripheral.advertisement.localName);
    peripheral.connect((error) => {
      if (error) {
        console.log("Error connecting to peripheral:", error);
      } else {
        peripheral.discoverServices([], (error, services) => {
          if (error) {
            console.log("Error discovering services:", error);
          } else {
            services.forEach((service) => {
              if (service.uuid == "fff0") {
                console.log("TX");
                console.log("Found service:", service.uuid);
                service.discoverCharacteristics(
                  [],
                  (error, characteristics) => {
                    if (error) {
                      console.log("Error discovering characteristics:", error);
                    } else {
                      characteristics.forEach((characteristic) => {
                        console.log(
                          "Found characteristic:",
                          characteristic.uuid
                        );
                        if (characteristic.uuid == "fff1") {
                          characteristic.on("data", (data, isNotification) => {
                            let payload = Buffer.from(data);
                            let numCells = payload.readInt16LE(4);
                            let volts = [];
                            for (let x = 1; x <= numCells; x++) {
                              let volt = payload.readInt16LE(x * 2 + 4) / 10;
                              volts.push(volt);
                              console.log(volts.join(", "));
                            }

                            console.log("Received data:", data.toString("hex"));
                          });
                          characteristic.notify(true, (error) => {
                            if (error) {
                              console.log(
                                "Error enabling notifications:",
                                error
                              );
                            } else {
                              console.log("Enabled notifications");
                            }
                          });
                        }
                      });
                    }
                  }
                );
              } else if (service.uuid == "ffd0") {
                console.log("RX");
                console.log("Found service:", service.uuid);
                service.discoverCharacteristics(
                  [],
                  (error, characteristics) => {
                    if (error) {
                      console.log("Error discovering characteristics:", error);
                    } else {
                      characteristics.forEach((characteristic) => {
                        console.log(
                          "Found characteristic:",
                          characteristic.uuid
                        );
                        if (characteristic.uuid == "ffd1") {
                          //   characteristic.write(
                          //     Buffer.from([
                          //       0x30, 0x03, 0x13, 0xb2, 0x00, 0x06, 0x65, 0x4a,
                          //     ]),
                          //     true,
                          //     (error) => {
                          //       if (error) {
                          //         console.log(
                          //           "Error writing to characteristic:",
                          //           error
                          //         );
                          //       } else {
                          //         console.log("Wrote to characteristic");
                          //       }
                          //     }
                          //   );

                          characteristic.write(
                            Buffer.from([
                              0x30, 0x03, 0x13, 0x88, 0x00, 0x11, 0x05, 0x49,
                            ]),
                            true,
                            (error) => {
                              if (error) {
                                console.log(
                                  "Error writing to characteristic:",
                                  error
                                );
                              } else {
                                console.log("Wrote to characteristic");
                              }
                            }
                          );
                        }
                      });
                    }
                  }
                );
              }
            });
          }
        });
      }
    });
    noble.stopScanning();
  }
});
