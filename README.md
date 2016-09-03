XY
===
🤖✏️ — node.js for makeblock XY plotter v2.0

### Features
- [./firmware](https://github.com/arnaudjuracek/xy/tree/master/firmware) : custom Arduino firmware
  - boundaries defined by the plotter's limit switches
  - pen's servo auto-sleep to prevent wear-out
  - faster _home_ command
- [./server](https://github.com/arnaudjuracek/xy/tree/master/server) : node.js server
  - SVG support
  - [Processing-like API](https://processing.org/reference/) for 2D primitives (see [usage](#usage) below)
  - commands chaining for better readability

### Installation

###### Firmware
_please note that this firmware has not been tested with the official makeblock softwares_
- download and install the [Arduino Software](https://www.arduino.cc/en/Main/Software)
- open [./firmware/firmware.ino](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino)
- upload it to your board, making sure you've selected the right port and board (_Leonardo_ or _Uno_ depending of your configuration)
- if you want to go back to the official firmware, use the [mDrawBot software](https://github.com/Makeblock-official/mDrawBot)

###### Server
```sh

```

### Usage
```js
```


### Credits
The Arduino firmware is based on [Michael Fogleman](https://github.com/fogleman/xy)'s one. 
Thanks to the Python works of Michael Fogleman and Anders Hoff to allow me establish a working communication between the XY and nodejs.

### License

MIT.
