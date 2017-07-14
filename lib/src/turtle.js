'use strict'

const Job = require('./job.js')
const sh = require('kool-shell')()
      sh.use(require('kool-shell/plugins/log'), {colors: true})

function Turtle (turtleName, opts, config) {
  opts = Object.assign({}, {
    x: config.width / 2,
    y: config.height / 2,
    angle: 0
  }, opts || {})

  // Turtle is an abstraction of Job with a different API
  let job = Job(turtleName, config).pen_up().move(opts.x, opts.y)

  let alpha = opts.angle
  let position = {
    x: opts.x,
    y: opts.y
  }

  let procedures = {}

  const api = {
    emit: job.emit,
    on: job.on,
    once: job.once,
    off: job.off,

    get name () { return turtleName },
    get buffer () { return job.buffer },

    // -------------------------------------------------------------------------
    // TURTLE API

    get position () { return position },
    get x () { return position.x },
    get y () { return position.y },
    get angle () { return alpha },

    home: () => {
      alpha = 0
      position.x = opts.x
      position.y = opts.y
      job.pen_up().move(opts.x, opts.y)
      return api
    },

    up: () => {
      job.pen_up(true)
      return api
    },

    down: () => {
      job.pen_down(true)
      return api
    },

    forward: (distance) => {
      position = point(position, alpha, distance)
      job.move(position.x, position.y)
      return api
    },

    backward: (distance) => {
      position = point(position, alpha, -distance)
      job.move(position.x, position.y)
      return api
    },

    back: (distance) => api.backward(distance),

    left: (a) => {
      alpha -= a
      return api
    },

    right: (a) => {
      alpha += a
      return api
    },

    // cartesian system from origin [opts.x, opts.y],
    // with X going right and Y going up
    setXY: (x, y) => {
      position.x = opts.x + x
      position.y = opts.y - y
      job.move(position.x, position.y)
      return api
    },

    repeat: (n, callback) => {
      for (let i = 0; i < n; i++) {
        typeof callback === 'function' && callback(api, i)
      }
      return api
    },

    // as in, "to do this, follow this procedure"
    // @SEE http://fmslogo.sourceforge.net/workshop/
    to: (procedureName, procedure) => {
      if (!isValidFunctionName(procedureName))
        return sh.error(`the procedure name '${procedureName}' is a not a valid name.`)

      if (~reserved.indexOf(procedureName))
        return sh.error(`the procedure name '${procedureName}' is a reserved keyword, try another one.`)

      if (typeof procedure !== 'function')
        return sh.error(`'${procedureName}' is not a valid function.`)


      api[procedureName] = (...args) => {
        procedure(api, ...args)
        return api
      }
    },

    // @IMPORTANT: calling turtle.procedureName after turtle.forget('procedureName') will
    // throw "TypeError: turtle.procedureName is not a function"
    forget: (procedureName) => {
      if (!~reserved.indexOf(procedureName) && typeof api[procedureName] === 'function') {
        delete api[procedureName]
      }
    }
  }

  const reserved = Object.keys(api)
  return api

  function isValidFunctionName (string) { return /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/.exec(string) !== null }
  function radians (alpha) { return alpha * Math.PI / 180 }
  function point (position, alpha, distance) {
    let theta = radians(alpha - 90)
    return {
      x: position.x + Math.cos(theta) * distance,
      y: position.y + Math.sin(theta) * distance
    }
  }
}

module.exports = Turtle
