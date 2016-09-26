<h1 align="center">:electric_plug::pencil2: XY</h1>
<h3 align="center">node.js for makeblock XY plotter v2.0</h3>

<div align="center">
  <!-- License -->
  <a href="https://raw.githubusercontent.com/arnaudjuracek/xy/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" />
  </a>
</div>


## Features
- [./firmware](https://github.com/arnaudjuracek/xy/tree/master/firmware) : custom Arduino firmware
  - boundaries defined by the plotter's limit switches
  - pen's servo auto-sleep to prevent wear-out
  - faster _home_ command
- [./lib](https://github.com/arnaudjuracek/xy/tree/master/lib) : node.js library
  - SVG support
  - [Processing-like API](https://processing.org/reference/) for 2D primitives (see [API](#api) below)
  - commands chaining for better readability

## Table of contents
- [Installation](#installation)
  - [Firmware](#firmware)
  - [Node](#node)
  - [Server](#server)
- [Usage](#usage)
  - [with a node.js script](#with-a-nodejs-script)
  - [With the raspberry-pi server](#with-the-raspberry-pi-server)
- [API](#api)
- [Credits](#credits)
- [License](#license)

## Installation

### Firmware
_please note that this firmware has not been tested with the official makeblock softwares_
- download and install the [Arduino Software](https://www.arduino.cc/en/Main/Software)
- open [./firmware/firmware.ino](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino)
- upload it to your board, making sure you've selected the right port and board (_Leonardo_ or _Uno_ depending of your configuration)
- if you want to go back to the official firmware, use the [mDrawBot software](https://github.com/Makeblock-official/mDrawBot)

### Node
```sh
npm install --save arnaudjuracek/xy
```

### Server
Although you can control the plotter using any node.js script on your client computer (see [usage with a node.js script](#with-a-nodejs-script)), I prefer to use a raspberry-pi server to handle the commands buffer.
```sh
# todo
```

## Usage

### With a node.js script
```js
// client <-> plotter
const plotter = require('xy-plotter').Plotter;

// open the serial communication with the plotter
plotter
  .connect('/dev/tty.wchusbserial1410', 115200)
  .catch((err) => {
    console.log(err);
    exit(1);
  });

// send all your commands
plotter
    .rect(10, 10, 100, 100)
    .circle(10, 10, 100);

// send an 'end' command via serial, then disconnect
plotter.end(() => plotter.disconnect());
```

### With the raspberry-pi server
```js
// client -> server <-> plotter
// todo
const plotter = require('xy-plotter').Server;
```

## API
[API reference](wiki/API-Reference)


## Credits
The Arduino firmware is based on [Michael Fogleman](https://github.com/fogleman/xy)'s one. 
Thanks to the Python works of [Michael Fogleman](https://github.com/fogleman/xy) and [Anders Hoff](https://github.com/inconvergent/) to allow me establish a working communication between the XY and nodejs.

## License

[MIT](https://tldrlegal.com/license/mit-license).
