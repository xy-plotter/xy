'use strict'

const benchmark = require('./utils/stats-benchmark')
const Emitter = require('tiny-emitter')

function Stats (job, config) {
  const cmds = parse(job.getBuffer())
  const em = new Emitter()
  const api = {
    emit: em.emit.bind(em),
    on: em.on.bind(em),
    once: em.once.bind(em),
    off: em.off.bind(em),

    getDistance () { return distance },
    getDuration () { return duration },
    getBenchmark () { return benchmark }
  }

  const distance = calcDistance(cmds)
  const duration = calcDuration(cmds)

  function calcDistance (cmds) {
    let dist = 0
    let px = 0
    let py = 0
    for (let i = 0; i < cmds.length; i++) {
      let cmd = cmds[i]
      if (cmd && cmd.instruction === 'G') {
        let x = cmd.x
        let y = cmd.y
        dist += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py))
        px = x
        py = y
      }
    }
    return round(dist, 3)
  }

  function calcDuration (cmds) {
    let duration = 0
    let servodistance = 0
    let servopos = 0
    let variation = {min: 0, max: 0}
    let dist = 0
    let px = 0
    let py = 0
    let speed

    for (let i = 0; i < cmds.length; i++) {
      let cmd = cmds[i]
      if (cmd) {
        if (cmd.instruction === 'G') {
          let x = cmd.x
          let y = cmd.y
          dist += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py))
          px = x
          py = y
        } else if (cmd.instruction === 'S') {
          duration += calc(dist, speed)

          if (!speed) {
            variation.min += dist / benchmark.speed.values[0].max
            variation.max += dist / benchmark.speed.values[0].min
            speed = null
          } else {
            // @SEE Plotter.Job.setSpeed() for the equation
            speed = (1100 - cmd.speed) / 1000
          }
          dist = 0
        } else if (cmd.instruction === 'M') {
          servodistance += Math.abs(servopos - cmd.position)
          servopos = cmd.position
        }
      }
    }

    if (dist > 0) duration += calc(dist, speed)
    if (servodistance > 0) duration += servodistance * 15 / 1000 // 15ms, @SEE firmware.ino

    function calc (dist, speed) {
      if (speed) return dist / benchmark.speed.interpolate(speed)
      else return dist / benchmark.speed.values[0].mmPerSecond
    }

    function secondToTime (seconds) {
      let date = new Date(null)
      date.setSeconds(seconds)
      return date.toISOString().substr(11, 8)
    }

    duration = round(duration, 0)
    variation.min = round(variation.min, 0)
    variation.max = round(variation.max, 0)

    return {
      estimation: {
        value: duration,
        formatted: secondToTime(duration)
      },
      min: {
        value: variation.min ? variation.min : duration - duration * 0.1,
        formatted: variation.min ? secondToTime(variation.min) : secondToTime(duration - duration * 0.1)
      },
      max: {
        value: variation.max ? variation.max : duration + duration * 0.1,
        formatted: variation.max ? secondToTime(variation.max) : secondToTime(duration + duration * 0.1)
      }
    }
  }

  function parse (buff) {
    let cmds = []
    for (let i = 0; i < buff.length; i++) {
      let cmd = parseCMD(buff[i])
      cmds.push(cmd)
    }

    return cmds
  }

  function parseCMD (message) {
    let params = message.split(' ')
    if (params[0] === ('G1')) {
      let cmd = {
        instruction: 'G',
        x: parseFloat(params[1].split('X').pop()),
        y: parseFloat(params[2].split('Y').pop())
      }
      return cmd
    } else if (params[0] === 'M1') {
      let cmd = {
        instruction: 'M',
        position: params[1]
      }
      return cmd
    } else if (params[0] === 'S0') {
      let cmd = {
        instruction: 'S',
        speed: null
      }
      return cmd
    } else if (params[0] === 'S1') {
      let cmd = {
        instruction: 'S',
        speed: parseFloat(params[1])
      }
      return cmd
    } else return null
  }

  function round (a, d = 3) { return +a.toFixed(d) }

  return api
}

module.exports = Stats
