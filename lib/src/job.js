'use strict'

const SVG = require('./utils/svg')()
const sh = require('kool-shell')

function Job (jobName, config) {
  let buffer = ['\n', '\0']
  let penIsUp = true
  let alreadyWarned = false
  let position = {x: 0, y: 0}

  const api = {
    // @DEPRECATED
    // callback: () => {},
    getName: () => { return jobName },
    getBuffer: () => { return [...buffer] },
    setBuffer: (_buffer) => {
      buffer = _buffer
      return api
    },

    addToBuffer: (message) => {
      // insert the message into the buffer before the last two commands \n and \0
      // \n is required by the firmware to launch the previous commands
      // \0 tells the firmware when the buffer ends
      buffer.splice(-2, 0, message)
      return api
    },

    // -------------------------------------------------------------------------
    // SETUP COMMANDS

    setSpeed: (speedPercent) => {
      if (speedPercent) {
        if (speedPercent < 0 || speedPercent > 1) {
          sh.warning(`Speed value must be between 0 and 1. Leaving speed setting unchanged.`)
          speedPercent = Math.min(1, Math.max(speedPercent, 0))
          return api
        }

        let maxDelay = 1000 // ms
        let securityMinDelay = 100 // ms
        let speed = securityMinDelay + maxDelay - (maxDelay * speedPercent)

        api.addToBuffer(`S1 ${speed}`)
      } else api.resetSpeed()
      return api
    },

    resetSpeed: () => { return api.addToBuffer(`S0`) },

    drawBoundaries: () => {
      return api.home()
                .pen_down()
                .setSpeed(0.8)
                .move(0, config.height)
                .move(config.width, config.height)
                .move(config.width, 0)
                .move(0, 0)
                .resetSpeed()
    },

    // -------------------------------------------------------------------------
    // UTILS COMMANDS

    home: () => {
      return api.pen_up()
                .resetSpeed()
                .addToBuffer('G28')
    },

    // @TODO : find a way to get the value
    getPosition: () => { return api.addToBuffer('P') },

    wait: (promise) => {
      function waitForIt () {
        return sh.question('Waiting... press enter to continue.', () => { return true })
      }

      return api.addToBuffer(promise || waitForIt)
    },

    // @DEPRECATED : a callback can now be called at the end of a job with the promises
    // @SEE serial.js
    // end(_callback) {
    //   // send a last command before disconnect
    //   // to ensure that the prev command is executed
    //   // by the plotter's firmware
    //   api.addToBuffer('\n')
    //   api.addToBuffer(-1)
    //   api.callback = _callback
    //   return api
    // },

    // -------------------------------------------------------------------------
    // PEN COMMANDS

    move: (x, y) => {
      // @FIXME : the plotter can't go from 0 to 380 in one move (???)
      if (Math.abs(position.x - x) > 380 * 0.5) {
        position.x = x - ((x - position.x) / 2)
        position.y = y - ((y - position.y) / 2)
        api.move(position.x, position.y)
      }

      position.x = x
      position.y = y
      x = round(x, config.decimals || 3)
      y = round(y, config.decimals || 3)

      // if the plotter is in portrait, swap x and y
      if (config.width / config.height > 1) {
        let t = x
        x = y
        y = t
      }

      if (x < 0 || x > config.width || y < 0 || y > config.height) {
        if (!alreadyWarned) {
          alreadyWarned = true
          sh.warning(`Some positions will be outside plotter's boundaries. [${x}, ${y}]`)
        }
      }

      return api.addToBuffer(`G1 X${x} Y${y}`)
    },

    pen: (position) => { return api.addToBuffer(`M1 ${position}`) },

    pen_up: (forceMotion = false) => {
      if (!penIsUp || forceMotion) {
        penIsUp = true
        api.pen(config.pen_positions.up || 0)
      }
      return api
    },

    pen_down: (forceMotion = false) => {
      if (penIsUp || forceMotion) {
        penIsUp = false
        api.pen(config.pen_positions.down || 90)
      }
      return api
    },

    // -------------------------------------------------------------------------
    // SVG COMMANDS

    svg: (file, _transformation) => {
      let points = SVG.fromFile(file)

      if (points && points.length > 0) {
        let AABB = SVG.getAABB(points)
        let transformation = Object.assign({
          x: AABB.x,
          y: AABB.y,
          width: AABB.width,
          height: AABB.height,
          angle: 0,
          origin: [0, 0]
        }, _transformation)

        for (let i = 0; i < points.length; i++) {
          let point = points[i]
          let position
          if (point[0] === 'M') {
            api.pen_up()
            position = transform(point[1], point[2], AABB, transformation)
          } else {
            api.pen_down()
            position = transform(point[0], point[1], AABB, transformation)
          }
          api.move(position.x, position.y)
        }
      } else sh.warning(`${file} doesn't contain any valid points.`)
      return api
    },

    // -------------------------------------------------------------------------
    // TEXT COMMANDS

    text: (string, x, y, fontsize = 10) => {
      let points = SVG.fromText(string, x, y, fontsize)
      for (let i = 0; i < points.length; i++) {
        let point = points[i]
        if (point[0] === 'M') {
          api.pen_up()
             .move(point[1], point[2])
        } else {
          api.pen_down()
             .move(point[0], point[1])
        }
      }
      return api
    },

    // -------------------------------------------------------------------------
    // 2D PRIMITIVES

    point: (x, y) => {
      return api.move(x, y)
                .pen_down()
                .pen_up()
    },

    polygon: (points) => {
      api.pen_up()
         .move(points[0][0], points[0][1])
         .pen_down()

      for (let i = 1; i < points.length; i++) {
        let point = points[i]
        api.move(point[0], point[1])
      }
      return api
    },

    line: (x1, y1, x2, y2) => {
      return api.polygon([[x1, y1], [x2, y2]])
    },

    ellipse: (cx, cy, w, h, sides = 100) => {
      let points = []
      for (let theta = 0; theta <= Math.PI * 2; theta += ((Math.PI * 2) / sides)) {
        let x = cx + Math.sin(theta) * w
        let y = cy + Math.cos(theta) * h
        points.push([x, y])
      }
      return api.polygon(points)
    },

    circle: (cx, cy, r, sides = 100) => {
      return api.ellipse(cx, cy, r, r, sides)
    },

    triangle: (x1, y1, x2, y2, x3, y3) => {
      return api.polygon([[x1, y1], [x2, y2], [x3, y3], [x1, y1]])
    },

    quad: (x1, y1, x2, y2, x3, y3, x4, y4) => {
      return api.polygon([[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x1, y1]])
    },

    rect: (x, y, w, h) => {
      return api.polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]])
    }
  }

  return api

  function round (a, d = 3) { return +a.toFixed(d) }
  function map (value, inMin, inMax, outMin, outMax) { return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin }
  function transform (x, y, AABB, t) {
    let coords = {
      x: map(x, AABB.x, AABB.width, t.x, t.x + t.width),
      y: map(y, AABB.y, AABB.height, t.y, t.y + t.height)
    }

    // @SEE: http://math.stackexchange.com/a/62248
    let theta = t.angle * Math.PI / 180
    let cos = Math.cos(theta)
    let sin = Math.sin(theta)
    let xc = map(t.origin[0], 0, 1, t.x, t.x + t.width)
    let yc = map(t.origin[1], 0, 1, t.y, t.y + t.height)
    let xt = coords.x - xc
    let yt = coords.y - yc
    let xr = xt * cos - yt * sin
    let yr = xt * sin + yt * cos

    coords.x = xr + xc - t.width * t.origin[0]
    coords.y = yr + yc - t.height * t.origin[1]
    return coords
  }
}

module.exports = Job
