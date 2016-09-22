XY
===
🤖✏️ — node.js for makeblock XY plotter v2.0

## Features
- [./firmware](https://github.com/arnaudjuracek/xy/tree/master/firmware) : custom Arduino firmware
  - boundaries defined by the plotter's limit switches
  - pen's servo auto-sleep to prevent wear-out
  - faster _home_ command
- [./server](https://github.com/arnaudjuracek/xy/tree/master/server) : node.js server
  - SVG support
  - [Processing-like API](https://processing.org/reference/) for 2D primitives (see [usage](#usage) below)
  - commands chaining for better readability

## Installation

### Firmware
_please note that this firmware has not been tested with the official makeblock softwares_
- download and install the [Arduino Software](https://www.arduino.cc/en/Main/Software)
- open [./firmware/firmware.ino](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino)
- upload it to your board, making sure you've selected the right port and board (_Leonardo_ or _Uno_ depending of your configuration)
- if you want to go back to the official firmware, use the [mDrawBot software](https://github.com/Makeblock-official/mDrawBot)

### Server
```sh
svn export https://github.com/arnaudjuracek/xy/trunk xy
cd xy
npm install
```

## Usage

```js
const plotter = require('./libs/plotter');

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

## API

### plotter.connect(port, baudrate, verbose = false)
Open a serial connection on the specified (the same you use in the Arduino software) with the specified baudrate (this should be `115200` if you use the custom [firmware](https://github.com/arnaudjuracek/xy/tree/master/firmware/firmware.ino)).
If `verbose` is set to `true`, the TTY will output in realtime the commands sent to the plotter.

### plotter.disconnect()
Close the serial connection and return a promise.
For a more gentle ending, use `plotter.end(() => plotter.disconnect())`

### plotter.setSpeed(percent)
Set the plotter's speed, overriding the default behavior with a linear speed. Accept the a value between `0` and `1`.
You should be able to fine tune this in the firmware.

### plotter.resetSpeed()
Reset the plotter's speed to its default non-linear speed.

### plotter.end(callback)
Send an ending command to the plotter, then execute a callback.

### plotter.home()
Set the plotter's position to its `[0, 0]` home.

### plotter.move(x, y)
Set the plotter's position to `[x, y]`. 

### plotter.pen_up(force_motion = false)
Lift up the plotter's pen. If `force_motion` is set to `true`, the plotter will attempt to lift its pen even if it considers it already lift up.
This is a shorthand for `plotter.pen(0)`.

### plotter.pen_down(force_motion = false)
Lower the plotter's pen. If `force_motion` is set to `true`, the plotter will attempt to lower its pen even if it considers it already lowered.
This is a shorthand for `plotter.pen(90)`.

### plotter.pen(position)
Set the position of the pen's servo to a specific value. Allows pressure related drawings.

### plotter.drawBoundaries()
Draw the biggest canvas size.

### plotter.point(x, y)
Draw a point at the specified `[x, y]` position.

### plotter.polygon([[x, y]])
Draw a closed poylgon, given an array of its vertices.

### plotter.line(x1, y1, x2, y2)
Draw a line from `[x1, y1]` to `[x2, y2]`.

### plotter.ellipse(cx, cy, w, h, sides = 100)
Draw an ellipse with at `[cx, cy]`, with a width of `w` and an height of `h`.

### plotter.circle(cx, cy, r, sides = 100)
Draw a circle at `[cx, cy]`, with a radius of `r`.

### plotter.triangle(x1, y1, x2, y2, x3, y3)
Draw a triangle between the points `[x1, y1]`, `[x2, y2]` and `[x3, y3]`. Shorthand for `plotter.polygon([[x1, y1], [x2, y2], [x3, y3]])`.

### quad(x1, y1, x2, y2, x3, y3, x4, y4)
Draw a quadrilateral between the points `[x1, y1]`, `[x2, y2]`, `[x3, y3]` and `[x4, y4]`.
Shorthand for `plotter.polygon([[x1, y1], [x2, y2], [x3, y3], [x4, y4]])`.

### rect(x, y, w, h)
Draw a rectangle from its left corner `[x, y]`, with a width of `w` and an height of `h`.

### plotter.svg(file, scale)
**[work in progress]** Draw the specified svg file.

### plotter.sendMessage(message)
Directly send a message to the plotter via its serial port. Useful if you want to build your own methods without altering the library.

### plotter.addToBuffer(message)
Add a command to the serial buffer. For mor details on how this buffer works, check the library sources.




## Credits
The Arduino firmware is based on [Michael Fogleman](https://github.com/fogleman/xy)'s one. 
Thanks to the Python works of [Michael Fogleman](https://github.com/fogleman/xy) and [Anders Hoff](https://github.com/inconvergent/) to allow me establish a working communication between the XY and nodejs.

## License

[MIT](https://tldrlegal.com/license/mit-license).
