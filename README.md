XY
===
🤖✏️ — node.js for makeblock XY plotter v2.0

### Features

- [./firmware](https://github.com/arnaudjuracek/xy/tree/master/firmware) : custom Arduino firmware
  - boundaries defined by the plotter's limit switches.
  - pen's servo auto-sleep to prevent wear.
- [./server](https://github.com/arnaudjuracek/xy/tree/master/rpi-server) : node.js server

### Installation

###### Firmware
- download and install the [Arduino Software](https://www.arduino.cc/en/Main/Software).
- open [./firmware/firmware.ino](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino).
- upload it to your board, making sure you've selected the right port and board (_Leonardo_ or _Uno_ depending of your configuration).

###### Server
```sh

```

### Credits
The arduino firmware is based on [Fogleman](https://github.com/fogleman/xy)'s one.

### License

MIT.
