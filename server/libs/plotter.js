const serial  = require('serialport');
const sh      = require('kool-shell');
const SVG     = require('./svg');

let buffer = [];
const WIDTH = 310;
const HEIGHT = 380;

module.exports = {
  buffer,
  WIDTH, HEIGHT,

  // -------------------------------------------------------------------------
  // SERIAL

  connect(address, baudRate, verbose = false) {
    this.verbose = verbose;
    this.up = true;
    this.port = new serial(address, {
      baudRate: baudRate,
      parser: serial.parsers.readline('\n'),
    });

    return new Promise((resolve, reject) => {
      this.port.on('open', function() {
        sh.info(`connecting to ${address}...`);
        sh.info(`waiting for handshake...`);
      });

      this.port.on('data', (data) => {
        if (!this.connected) resolve(data);
        this.processBuffer();
      });

      this.port.on('error', (err) => {
        reject(new Error(err, 'plotter.js'));
      });
    }).then(() => {
      sh.success('connected.');
      this.connected = true;
    });
  },

  disconnect() {
    return new Promise((resolve, reject) => {
      if (this.port) {
        this.port.close(() => {
          resolve('disconnected.');
        });
      } else reject(new Error('port is alread disconnected.'));
    }).then((res) => {
      sh.success(res);
      this.connected = false;
    }).catch((err) => {
      sh.error(err);
    });
  },

  // -------------------------------------------------------------------------
  // COMMUNICATION

  addToBuffer(message) { this.buffer.push(message); },

  processBuffer() {
    if (this.buffer.length > 0) {
      let message = this.buffer.shift();
      if (message) this.sendMessage(message);
      else if (this.onEndCallback) this.onEndCallback();
    }
  },

  sendMessage(message) {
    if (this.port) {
      this.port.write(`${message}\n`, (err) => {
        if (err) sh.error(new Error(err, 'plotter.js'));
        else {
          if (this.verbose) sh.info(message);
        }
      });
    } else sh.error(new Error('port isn\'t openned.', 'plotter.js'));
  },

  // -------------------------------------------------------------------------
  // SETUP COMMANDS

  setSpeed(speedPercent) {
    if (speedPercent) {
      let maxDelay = 1000; // ms
      let securityMinDelay = 100; // ms
      if (speedPercent > 1) {
        sh.warning(`Speed value must be between 0 and 1.`);
        speedPercent = Math.min(1, speedPercent);
      }
      let speed = securityMinDelay + maxDelay - (maxDelay * speedPercent);
      this.addToBuffer(`S1 ${speed}`);
    } else this.resetSpeed();
    return this;
  },

  resetSpeed() {
    this.addToBuffer(`S0`);
    return this;
  },

  drawBoundaries() {
    this
      .home()
      .pen_down()
      // FIXME : the plotter can't go from 0 to HEIGHT in one move (???)
      .move(0, this.HEIGHT / 2)
      .move(0, this.HEIGHT)
      .move(this.WIDTH, this.HEIGHT)
      .move(this.WIDTH, this.HEIGHT / 2)
      .move(this.WIDTH, 0)
      .move(0, 0);
    return this;
  },

  // -------------------------------------------------------------------------
  // UTILS COMMANDS

  getPosition() {
    this.addToBuffer('P');
    return this;
  },

  home() {
    this.pen_up();
    this.addToBuffer('G28');
    return this;
  },

  end(callback) {
    // send a last command before disconnect
    // to ensure that the prev command is executed
    // by the plotter's firmware
    this.addToBuffer('\n');
    this.addToBuffer(null);
    this.onEndCallback = callback;
    return this;
  },

  move(x, y) {
    if (x < 0 || x > this.WIDTH || y < 0 || y > this.HEIGHT) {
      sh.warning(`G1 X${x} Y${y} : position will be outside plotter's boundaries.`);
    }
    this.addToBuffer(`G1 X${x} Y${y}`);
    return this;
  },

  // -------------------------------------------------------------------------
  // PEN COMMANDS

  pen(position) {
    this.addToBuffer(`M1 ${position}`);
    return this;
  },

  pen_up(force_motion = false) {
    if (!this.up || force_motion) {
      this.up = true;
      this.pen(0);
    }
    return this;
  },

  pen_down(force_motion = false) {
    if (this.up || force_motion) {
      this.up = false;
      this.pen(90);
    }
    return this;
  },

  // -------------------------------------------------------------------------
  // SVG COMMANDS

  svg(file, scale) {
    let points = SVG(file, scale);
    if (points && points.length > 0) {
      for (let i = 0; i < points.length; i++) {
        let point = points[i];
        if (point[0] === 'M') {
          this
          .pen_up()
          .move(point[1], this.HEIGHT - point[2]);
        } else {
          this
          .pen_down()
          .move(point[0], this.HEIGHT - point[1]);
        }
      }
    } else {
      sh.warning(`${file} doesn't contain any valid points.`);
    }
    return this;
  },

  // -------------------------------------------------------------------------
  // 2D PRIMITIVES

  point(x, y) {
    this.move(x, y);
    // TODO : find a better temporisation method
    for (let i = 0; i < 2; i++) this.pen_down(true);
    this.pen_up();
    return this;
  },

  polygon(points) {
    this
      .pen_up()
      .move(points[0][0], points[0][1])
      .pen_down();

    for (let i = 1; i < points.length; i++) {
      let point = points[i];
      this.move(point[0], point[1]);
    }
    return this;
  },

  line(x1, y1, x2, y2) {
    return this.polygon([[x1, y1], [x2, y2]]);
  },

  ellipse(cx, cy, w, h, sides = 100) {
    let points = [];
    for (let theta = 0; theta <= Math.PI * 2; theta += (Math.PI / sides)) {
      let x = cx + Math.sin(theta) * w;
      let y = cy + Math.cos(theta) * h;
      points.push([x, y]);
    }
    return this.polygon(points);
  },

  circle(cx, cy, r, sides = 100) {
    return this.ellipse(cx, cy, r, r, sides);
  },

  triangle(x1, y1, x2, y2, x3, y3) {
    return this.polygon([[x1, y1], [x2, y2], [x3, y3], [x1, y1]]);
  },

  quad(x1, y1, x2, y2, x3, y3, x4, y4) {
    return this.polygon([[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x1, y1]]);
  },

  rect(x, y, w, h) {
    return this.polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]);
  }


};