'use strict'

const job = require('./src/job')
const turtle = require('./src/turtle')
const serial = require('./src/serial')
const server = require('./src/server')
const file = require('./src/file')
const stats = require('./src/stats')
const defaultConfig = require('./config.json')

function Plotter (_config) {
  const config = Object.assign(JSON.parse(JSON.stringify(defaultConfig)), _config)

  return {
    get config () { config },
    get width () { config.width },
    get height () { config.height },
    get defaultConfig () { defaultConfig },

    Job: (jobName) => { return job(jobName, config) },
    Turtle: (turtleName, _opts) => { return turtle(turtleName, _opts, config) },
    Serial: (address, _opts) => { return serial(address, _opts) },
    Server: (address, _opts) => { return server(address, _opts) },
    File: () => { return file(config) },
    Stats: (job) => { return stats(job, config) }
  }
}

module.exports = Plotter
