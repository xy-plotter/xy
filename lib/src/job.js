const SVG   = require('./utils/svg')();
const sh    = require('kool-shell');

function Job(jobName, config) {

  let buffer = ['\n', '\0'];
  let penIsUp = true;

  const api = {
    // DEPRECATED
    // callback: function(){},
    getName() { return jobName; },
    getBuffer() { return [...buffer]; },
    setBuffer(_buffer) {
      buffer = _buffer;
      return api;
    },

    addToBuffer(message) {
      // insert the message into the buffer before the last two commands \n and \0
      // \n is required by the firmware to launch the previous commands
      // \0 tells the firmware when the buffer ends
      buffer.splice(-2, 0, message);
      return api;
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
        api.addToBuffer(`S1 ${speed}`);
      } else api.resetSpeed();
      return api;
    },

    resetSpeed() {
      api.addToBuffer(`S0`);
      return api;
    },

    drawBoundaries() {
      api
        .home()
        .pen_down()
        .setSpeed(.8)
        // FIXME : the plotter can't go from 0 to HEIGHT in one move (???)
        .move(0, config.height / 2)
        .move(0, config.height)
        .move(config.width, config.height)
        .move(config.width, config.height / 2)
        .move(config.width, 0)
        .move(0, 0)
        .resetSpeed();
      return api;
    },

    // -------------------------------------------------------------------------
    // UTILS COMMANDS

    home() {
      api
        .pen_up()
        .resetSpeed();
      api.addToBuffer('G28');
      return api;
    },

    // TODO : find a way to get the value
    getPosition() {
      api.addToBuffer('P');
      return api;
    },

    wait(promise) {
      function waitForIt() {
        return sh.question('Waiting... press enter to continue.', () => { return true; });
      }
      api.addToBuffer(promise || waitForIt);
      return api;
    },

    // DEPRECATED : a callback can now be called at the end of a job
    // with the promises, see serial.js
    // end(_callback) {
    //   // send a last command before disconnect
    //   // to ensure that the prev command is executed
    //   // by the plotter's firmware
    //   api.addToBuffer('\n');
    //   api.addToBuffer(-1);
    //   api.callback = _callback;
    //   return api;
    // },

    // -------------------------------------------------------------------------
    // PEN COMMANDS

    move(x, y) {
      x = round(x, config.decimals || 3);
      y = round(y, config.decimals || 3);

      // if the plotter is in portrait, swap x and y
      if (config.width / config.height > 1) {
        let t = x;
        x = y;
        y = t;
      }

      if (x < 0 || x > config.width || y < 0 || y > config.height) {
        sh.warning(`G1 X${x} Y${y} : position will be outside plotter's boundaries.`);
      }
      api.addToBuffer(`G1 X${x} Y${y}`);
      return api;
    },

    pen(position) {
      api.addToBuffer(`M1 ${position}`);
      return api;
    },

    pen_up(force_motion = false) {
      if (!penIsUp || force_motion) {
        penIsUp = true;
        api.pen(config.pen_positions.up || 0);
      }
      return api;
    },

    pen_down(force_motion = false) {
      if (penIsUp || force_motion) {
        penIsUp = false;
        api.pen(config.pen_positions.down || 90);
      }
      return api;
    },

    // -------------------------------------------------------------------------
    // SVG COMMANDS

    svg(file, _transformation) {
      let points = SVG.fromFile(file);
      if (points && points.length > 0) {
        let AABB = SVG.getAABB(points);
        let transformation = Object.assign({
          x: AABB.x,
          y: AABB.y,
          width: AABB.width,
          height: AABB.height,
          angle: 0,
          origin: {x: 0, y: 0}
        }, _transformation);

        for (let i = 0; i < points.length; i++) {
          let point = points[i];
          let position;
          if (point[0] === 'M') {
            api.pen_up();
            position = transform(point[1], point[2], AABB, transformation);
          } else {
            api.pen_down();
            position = transform(point[0], point[1], AABB, transformation);
          }
          api.move(position.x, position.y);
        }

        function transform(x, y, AABB, t) {
          let coords = {
            x: map(x, AABB.x, AABB.width, t.x, t.x + t.width),
            y: map(y, AABB.y, AABB.height, t.y, t.y + t.height)
          };

          // SEE: http://math.stackexchange.com/a/62248
          let theta = t.angle * Math.PI / 180;
          let cos = Math.cos(theta);
          let sin = Math.sin(theta);
          let xc = map(t.origin.x, 0, 1, t.x, t.x + t.width);
          let yc = map(t.origin.y, 0, 1, t.y, t.y + t.height);
          let xt = coords.x - xc;
          let yt = coords.y - yc;
          let xr = xt * cos - yt * sin;
          let yr = xt * sin + yt * cos;

          coords.x = xr + xc - t.width * t.origin.x;
          coords.y = yr + yc - t.height * t.origin.y;
          return coords;
        }
      } else {
        sh.warning(`${file} doesn't contain any valid points.`);
      }
      return api;
    },


    // -------------------------------------------------------------------------
    // TEXT COMMANDS

    text(string, x, y, fontsize = 10) {
      let points = SVG.fromText(string, x, y, fontsize);
      for (let i = 0; i < points.length; i++) {
        let point = points[i];
        if (point[0] === 'M') {
          api
            .pen_up()
            .move(point[1], point[2]);
        } else {
          api
            .pen_down()
            .move(point[0], point[1]);
        }
      }
      return api;
    },

    // -------------------------------------------------------------------------
    // 2D PRIMITIVES

    point(x, y) {
      return api
              .move(x, y)
              .pen_down()
              .pen_up();
    },

    polygon(points) {
      api
        .pen_up()
        .move(points[0][0], points[0][1])
        .pen_down();

      for (let i = 1; i < points.length; i++) {
        let point = points[i];
        api.move(point[0], point[1]);
      }
      return api;
    },

    line(x1, y1, x2, y2) {
      return api.polygon([[x1, y1], [x2, y2]]);
    },

    ellipse(cx, cy, w, h, sides = 100) {
      let points = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += ((Math.PI * 2) / sides)) {
        let x = cx + Math.sin(theta) * w;
        let y = cy + Math.cos(theta) * h;
        points.push([x, y]);
      }
      return api.polygon(points);
    },

    circle(cx, cy, r, sides = 100) {
      return api.ellipse(cx, cy, r, r, sides);
    },

    triangle(x1, y1, x2, y2, x3, y3) {
      return api.polygon([[x1, y1], [x2, y2], [x3, y3], [x1, y1]]);
    },

    quad(x1, y1, x2, y2, x3, y3, x4, y4) {
      return api.polygon([[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x1, y1]]);
    },

    rect(x, y, w, h) {
      return api.polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]);
    },
  };

  function round(a, d = 3) { return +a.toFixed(d); }
  function map(value, in_min, in_max, out_min, out_max) { return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min; }

  return api;
}

module.exports = Job;