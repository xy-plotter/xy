const serial = require('serialport');
const sh = require('kool-shell');

let data = null;
let buffer = [];

const Plotter = {
  data,
  buffer,

  connect(_port, _baudRate) {
    port = new serial(_port, {
      baudRate: _baudRate,
      parser: serial.parsers.readline('\n'),
    });

    return new Promise((resolve, reject) => {
      port.on('open', function() {
        sh.success(`connected to ${_port}`);
        sh.info(`waiting for handshake...`);
      });

      port.on('data', (data) => {
        sh.warning(data);
        resolve(data);
        this.processBuffer();
      });

      port.on('error', function(err) {
        reject(new Error(err, 'plotter.js'));
      });
    });
  },

  // -------------------------------------------------------------------------

  sendMessage(message, verbose = false) {
    if (port) {
      message = message + '\n';
      port.write(message, function(err) {
        if (err) sh.error(new Error(err, 'plotter.js'));
        else {
          if (verbose) sh.info(message);
        }
      });
    } else sh.error(new Error('port isn\'t openned.', 'plotter.js'));
  },

  addToBuffer(message, verbose = false) {
    if (verbose) sh.info('add to buffer', message);
    this.buffer.push(message);
  },

  processBuffer() {
    if (this.buffer.length > 0) {
      let message = this.buffer.shift();
      this.sendMessage(message);
    }
  },

  // -------------------------------------------------------------------------

  getPosition() {
    this.addToBuffer('P');
    return this;
  },

  pen(position, verbose = false) {
    this.addToBuffer(`M1 ${position}`, verbose);
    return this;
  },

  move(x, y, verbose = false) {
    this.addToBuffer(`G1 X${x} Y${y}`, verbose);
    return this;
  },

  home(verbose = false) {
    this.addToBuffer('G28', verbose);
    return this;
  },

  // -------------------------------------------------------------------------

  pen_up(verbose = false) {
    this.pen(0, verbose);
    return this;
  },

  pen_down(verbose = false) {
    this.pen(90, verbose);
    return this;
  },

  draw(x, y, verbose = false) {
    this.pen_down(verbose);
    this.move(x, y, verbose);
    this.pen_up(verbose);
    return this;
  },


}

module.exports = Plotter;