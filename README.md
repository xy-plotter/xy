<h1 align="center">:electric_plug::pencil2: XY</h1>
<h3 align="center">node.js for makeblock XY plotter v2.0</h3>

<div align="center">
  <!-- License -->
  <a href="https://raw.githubusercontent.com/arnaudjuracek/xy/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" />
  </a>
</div>

<div align="center">
  <a href="http://www.makeblock.com/xy-plotter-robot-kit/">
    <img src="preview.jpg?raw=true">
  </a>
</div>
<!-- 
## Features
- [./firmware](https://github.com/arnaudjuracek/xy/tree/master/firmware) : custom Arduino firmware
  - boundaries defined by the plotter's limit switches
  - pen's servo auto-sleep to prevent wear-out
  - faster _home_ command
- [./lib](https://github.com/arnaudjuracek/xy/tree/master/lib) : node.js library
  - SVG support
  - [Processing-like API](https://processing.org/reference/) for 2D primitives (see [API](#api) below)
  - commands chaining for better readability -->

## Table of contents
- [Installation](#installation)
  - [Node](#node)
  - [Firmware](#firmware)
  - [Server](#server)
- [Usage](#usage)
  - [With a node.js script](#with-a-nodejs-script)
  - [With the raspberry-pi server](#with-the-raspberry-pi-server)
- [API](#api)
- [Contribute](#contribute)
- [Credits](#credits)
- [License](#license)

## Installation

### Node
```sh
npm install --save arnaudjuracek/xy
```
<sup>please note that this module has not been tested with the official makeblock firmwares</sup>



### Firmware
- download and install the [Arduino Software](https://www.arduino.cc/en/Main/Software)
- open [./firmware/firmware.ino](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino)
- upload it to your board, making sure you've selected the right port and board (_Leonardo_ or _Uno_ depending of your configuration)
- if you want to go back to the official firmware, use the [mDrawBot software](https://github.com/Makeblock-official/mDrawBot)

<sup>please note that this firmware has not been tested with the official makeblock softwares</sup>

### Server
Although you can control the plotter using any node.js script on your client computer (see [usage with a node.js script](#with-a-nodejs-script)), I prefer to use a raspberry-pi server to handle the commands buffer.
```sh
# todo
```

## Usage

### With a node.js script
```js
var plotter = require('xy-plotter')();
var job = plotter.Job('my-job-name');

job.rect(10, 10, 100, 100).circle(10, 10, 100);
job.pen_down().move(100, 100);

var serial = plotter.Serial('/dev/tty.wchusbserial1410');
seria.send(job).then(() => {
    console.log('the job is done !');
});
```

### With the raspberry-pi server
```js
// todo
```

### More
See [examples](https://github.com/arnaudjuracek/xy/wiki/Examples) for more advanced usages.

## API

[API reference](https://github.com/arnaudjuracek/xy/wiki/API-Reference)

## Contribute

### Issues 
Feel free to submit any issue or request.

### Pull Request
1. **Fork** the repo on GitHub
2. **Clone** the project to your own machine
3. **Commit** changes to your own branch
4. **Push** your work back up to your fork
5. Submit a **Pull request** so that we I review your changes

<sup>Be sure to merge the latest from "upstream" before making a pull request !</sup>

### Wiki and examples
Contributions to the [examples](https://github.com/arnaudjuracek/xy/wiki/Examples) are very welcome !



## Credits
The Arduino firmware is based on [Michael Fogleman](https://github.com/fogleman/xy)'s one. 
Thanks to the work in Python of [Michael Fogleman](https://github.com/fogleman/xy) and [Anders Hoff](https://github.com/inconvergent/), which helped me establish a working communication between the XY and nodejs.

## License

[MIT](https://tldrlegal.com/license/mit-license).
