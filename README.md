
<h1 align="center">XY</h1>
<div align="center">
  <a href="http://www.makeblock.com/xy-plotter-robot-kit/">
    <img src="preview.png?raw=true">
  </a>
</div>
<h3 align="center">node.js for makeblock XY plotter v2.0</h3>
<div align="center">
  <!-- Version -->
  <img alt="version" src="https://img.shields.io/badge/version-2.10.1-orange.svg?style=flat-square"/>
  <!-- Standard -->
  <a href="http://standardjs.com/">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="Standard" />
  </a>
  <!-- License -->
  <a href="https://raw.githubusercontent.com/arnaudjuracek/xy/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" />
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
- [API](#api)
- [Contribute](#contribute)
- [Credits](#credits)
- [License](#license)

## Installation

### Node
```sh
npm install --save arnaudjuracek/xy
```
<sup>Note: this module has not been tested with the official makeblock firmwares</sup>



### Firmware
- download and install the [Arduino Software](https://www.arduino.cc/en/Main/Software)
- open [./firmware/firmware.ino](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino)
- upload it to your board, making sure you've selected the right port and board (_Leonardo_ or _Uno_ depending of your configuration)
- if you want to go back to the official firmware, use the [mDrawBot software](https://github.com/Makeblock-official/mDrawBot)

<sup>Note: this firmware has not been tested with the official makeblock softwares</sup>

### Server
Although you can control the plotter using any node.js script on your client computer (see [usage](#with-a-nodejs-script) below), keeping an open serial connection for several hours can become tedious. That is why I'm using a raspberry pi as a printing server. See [arnaudjuracek/xy-server](https://github.com/arnaudjuracek/xy-server).

## Usage

###### node.js
```js
const plotter = require('xy-plotter')()
const job = plotter.Job('my-job-name')

job.rect(10, 10, 100, 100)
   .circle(10, 10, 100)
   .pen_down()
   .move(100, 100)

const serial = plotter.Serial('/dev/tty.wchusbserial1410')
serial.send(job).then(() => {
  console.log('the job is done !')
})
```

###### more
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
