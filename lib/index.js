'use strict'

const events = require('events')
const job = require('./src/job')
const serial = require('./src/serial')
const server = require('./src/server')
const file = require('./src/file')
const stats = require('./src/stats')
const defaultConfig = require('./config.json')

function Plotter (_config) {
  const config = Object.assign(JSON.parse(JSON.stringify(defaultConfig)), _config)
  const em = new events.EventEmitter()

  return {
    config: config,
    width: config.width,
    height: config.height,
    defaultConfig: defaultConfig,

    emitter: em,
    on: em.on.bind(em),
    once: em.once.bind(em),
    emit: em.emit.bind(em),
    addListener: em.addListener.bind(em),
    removeListener: em.removeListener.bind(em),

    Job: (jobName) => { return job(jobName, config) },
    Serial: (address, _opts) => { return serial(address, _opts, em) },
    Server: (address, _opts) => { return server(address, _opts) },
    File: () => { return file(config) },
    Stats: (job) => { return stats(job, config) }
  }
}

module.exports = Plotter
