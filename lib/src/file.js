'use strict'

const fs = require('fs')
const _path = require('path')
const Canvas = require('canvas')
const jsonfile = require('jsonfile')
const Job = require('./job.js')
const sh = require('kool-shell')()
      sh.use(require('kool-shell/plugins/log'), {colors: true})

function File (config) {
  const supportedExtensions = ['.png', '.jpg', '.jpeg', '.svg']

  const api = {
    export: (job, path, _opts) => {
      const opts = Object.assign({
        width: config.width * 4,
        height: config.height * 4,
        stroke: '#000',
        background: '#FFF',
        strokeWeight: 1,
        quality: 75, // JPEG quality
        progressive: false // JPEG progressive compression
      }, _opts)

      if (job === null || job === undefined) {
        sh.error(new Error('File.export(): job undefined.'))
        return false
      }

      if (path === null || path === undefined) {
        sh.error(new Error('File.export(): a path must be specified.'))
        return false
      }

      let extension = _path.extname(path).toLowerCase()
      if (!~supportedExtensions.indexOf(extension) || extension === null || extension === undefined) {
        sh.error(new Error(`File.export(): ${path} cannot be exported. Try one of these extensions : ${supportedExtensions.join(', ')}.`))
        return false
      }

      let canvas = new Canvas(opts.width, opts.height, (extension === '.svg') ? 'svg' : null)
      let ctx = canvas.getContext('2d')
      let scale = {
        x: canvas.width / config.width,
        y: canvas.height / config.height
      }

      // png and jpg are streamed, svg is written once ctx drawing is done
      if (~['.png', '.jpg', '.jpeg'].indexOf(extension)) {
        let out = fs.createWriteStream(path)
        let stream = extension === '.png' ? canvas.pngStream() : canvas.jpegStream({quality: opts.quality, progressive: opts.progressive})

        sh.info(`writing ${path}...`)
        stream.on('data', (chunk) => out.write(chunk))
        stream.on('end', () => sh.success(`${path} successfully written !`))
      }

      let buffer = job.getBuffer()

      ctx.fillStyle = opts.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = opts.stroke // used to draw points
      ctx.strokeStyle = opts.stroke
      ctx.lineWidth = opts.strokeWeight

      for (let i = 0, x = 0, y = 0, penIsUp = true; i < buffer.length; i++) {
        let message = buffer[i]
        let cmd = parse(message)
        if (cmd) {
          switch (cmd.instruction) {
            case 'G' :
              if (penIsUp) {
                x = cmd.x * scale.x
                y = cmd.y * scale.y
                ctx.moveTo(x, y)
              } else {
                ctx.beginPath()
                ctx.moveTo(x, y)
                x = cmd.x * scale.x
                y = cmd.y * scale.y
                ctx.lineTo(x, y)
                ctx.stroke()
                ctx.closePath()
              }
              break
            case 'M' :
              if (penIsUp && !cmd.up) ctx.fillRect(x - opts.strokeWeight / 2, y - opts.strokeWeight / 2, opts.strokeWeight, opts.strokeWeight)
              penIsUp = cmd.up
              break
          }
        }
      }
      if (extension === '.svg') {
        fs.writeFile(path, canvas.toBuffer(), () => {
          sh.success(`${path} successfully written !`)
        })
      }
    },

    save: (job, path) => {
      let jobName = job.getName()
      path = path || _path.join(__dirname, jobName + '.json')

      sh.info(`saving ${path}...`)
      jsonfile.writeFileSync(path, job.getBuffer())
      sh.success(`${jobName} successfully saved to ${path} (${getFilesizeInKiloBytes(path)}kb)`)
    },

    load: (path) => {
      try {
        let jobName = _path.basename(path).replace(/\.[^/.]+$/, '')
        sh.info(`loading ${path}...`)
        let buffer = jsonfile.readFileSync(path)
        sh.success(`${jobName} successfully loaded !`)

        return Job(jobName).setBuffer(buffer)
      } catch (e) {
        sh.error(e)
        return null
      }
    }
  }

  return api

  function parse (message) {
    if (typeof message === 'string' || message instanceof String) {
      let params = message.split(' ')
      if (params[0] === ('G1')) {
        let cmd = {
          instruction: 'G',
          y: parseFloat(params[1].split('X').pop()),
          x: parseFloat(params[2].split('Y').pop())
        }
        return cmd
      } else if (params[0] === 'M1') {
        let cmd = {
          instruction: 'M',
          up: (parseInt(params[1]) === config.pen_positions.up)
        }
        return cmd
      } else return null
    } else return null
  }

  function getFilesizeInKiloBytes (filename) {
    let stats = fs.statSync(filename)
    let fileSizeInBytes = stats['size']
    return Math.ceil(fileSizeInBytes / 1000)
  }
}

module.exports = File
