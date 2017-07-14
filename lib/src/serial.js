'use strict'

const SerialPort = require('serialport')
const progress = require('cli-progress')
const Emitter = require('tiny-emitter')
const sh = require('kool-shell')()
sh.use(require('kool-shell/plugins/log'), {colors: true})

function Serial (address, _opts) {
  const opts = Object.assign({
    baudRate: 115200,
    verbose: false,
    progressBar: true,
    disconnectOnJobEnd: true
  }, _opts)

  let port = new SerialPort(address, {
    baudRate: opts.baudRate,
    autoOpen: false,
    parser: SerialPort.parsers.readline('\n')
  })

  let progressBar
  let connected = false
  let paused = false

  const em = new Emitter()
  const api = {
    emit: em.emit.bind(em),
    on: em.on.bind(em),
    once: em.once.bind(em),
    off: em.off.bind(em),

    get connected () { return connected },
    get paused () { return paused },

    pause: () => {
      paused = true
      em.emit('pause')
      progressBar && progressBar.stop()
      return api
    },

    resume: () => {
      paused = false
      em.emit('resume')

      api.sendCommand('\n')
      return api
    },

    connect: () => {
      sh.info(`opening serialport ${address}...`)
      return new Promise((resolve, reject) => {
        port.on('error', err => error(new Error(err.message), reject))
        port.open((err) => {
          if (err) error(new Error(err.message), reject)
          else {
            sh.info(`waiting for handshake...`)
            port.on('data', onHandshake)
          }
        })

        function onHandshake (data) {
          if (data.charAt(0) === 'N') {
            if (!connected) {
              api.sendCommand('\n')
              connected = true
              port.removeListener('data', onHandshake)

              sh.success('connected.')
              em.emit('connect')
              resolve('connected.')
            }
          }
        }
      })
    },

    disconnect: () => {
      return new Promise((resolve, reject) => {
        port.close(() => {
          connected = false
          sh.success('disconnected.')
          em.emit('disconnect')
          resolve()
        })
      })
    },

    sendList: (jobs) => {
      return new Promise((resolve, reject) => {
        let i = 0
        let len = jobs.length
        ;(function iterate () {
          if (i >= len) return resolve()
          api.send(jobs[i]).then(() => { i++; iterate() })
        })()
      })
    },

    send: (job, streamed = false) => {
      if (job === null || job === undefined) return Promise.reject(new Error(`Serial.send(): 'job' is undefined or null`))
      if (!connected) return api.connect().then(() => api.send(job, streamed))
      else {
        let buffer = job.buffer
        console.log(buffer)
        const initialBufferLength = buffer.length

        function onJobData (data) {
          if (data.cmd) {
            buffer.push(data.cmd)
            port.emit('data')
          }
        }

        function onPortData (data) {
          if (buffer.length > 0) {
            if (!paused) {
              let cmd = buffer.shift()
              if (cmd instanceof Function) { // handle job.wait()
                api.pause()
                cmd().then(() => {
                  opts.progressBar && updateProgress(streamed ? -1 : buffer.length)
                  api.resume()
                })
              } else if (cmd) { // basic commands
                if (opts.progressBar) updateProgress(streamed ? -1 : buffer.length, (opts.verbose ? cmd : null))
                else if (opts.verbose) sh.info(cmd)

                em.emit('job-progress', {
                  job: job,
                  cmd: cmd,
                  progress: {
                    total: initialBufferLength,
                    elapsed: initialBufferLength - buffer.length,
                    remaining: buffer.length
                  }
                })

                api.sendCommand(cmd)
              }
            }
          } else if (!streamed) {
            api.end(job)
            sh.success(`job '${job.name}' done.`)
          }
        }

        return new Promise((resolve, reject) => {
          sh.info(streamed ? 'streaming' : 'starting',  `'${job.name}'...`)
          em.emit('job-start', {job: job})

          if (streamed) job.on('data', onJobData)
          port.on('data', onPortData)
          em.on('job-end', onJobEnd)

          function onJobEnd (data) {
            // @NOTE: this data handler is declared inside the Promise to expose resolve/reject
            if (data.job.name === job.name) {
              job.off(onJobData)
              em.off('job-end', onJobEnd)
              port.removeListener('data', onPortData)

              if (opts.disconnectOnJobEnd) api.disconnect().then(() => resolve(job))
              else return api.sendCommand('G28').then(() => resolve(job)) // goHome to avoid plotter's position shifting
            }
          }
        })
      }
    },

    end: (job) => {
      if (job === null || job === undefined) {
        sh.error(new Error(`Serial.end(): 'job' is undefined or null`))
        return false
      }

      if (opts.progressBar && progressBar) progressBar.stop()
      em.emit('job-end', {job: job})
    },

    sendCommand: (cmd) => {
      return new Promise((resolve, reject) => {
        if (port.isOpen) {
          port.write(`${cmd}\n`, (err) => {
            if (err) error(new Error(err.message), reject)
            else resolve()
          })
        } else error(new Error('Serial.sendCommand(): port is not open'), reject)
      })
    }
  }

  return api

  function updateProgress (bufferLength, cmd = null) {
    if (progressBar) {
      if (cmd && cmd !== '\n') progressBar.format = `[{bar}] {percentage}% | {duration_formatted} [${cmd}]`
      progressBar.increment()
    } else {
      progressBar = new progress.Bar({format: '[{bar}] {percentage}% | {duration_formatted}'})
      progressBar.start(bufferLength, 0)
    }
  }

  function error (err, reject = null) {
    sh.error(err)
    em.emit('error', err)
    reject && reject(err)
  }
}

module.exports = Serial
