'use strict'

const io = require('socket.io-client')
const Emitter = require('tiny-emitter')

function Server (address, _opts) {
  const opts = Object.assign({
    port: 8080
  }, _opts)

  const socket = io(`http://${address}:${opts.port}`)
  const em = new Emitter()
  const api = {
    emit: em.emit.bind(em),
    on: em.on.bind(em),
    once: em.once.bind(em),
    off: em.off.bind(em),

    queue: (job, cb = null) => {
      sendSocketEvent('job', {
        name: job.name,
        buffer: job.buffer
      }, cb)
      return api
    }
  }

  return api

  function sendSocketEvent (event, data, cb = null) {
    socket.connect()
    socket.emit(event, data, (validation) => {
      if (cb) {
        if (validation) cb(true)
        else cb(false)
      }
      socket.disconnect()
    })
  }
}

module.exports = Server
