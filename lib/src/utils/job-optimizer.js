'use strict'

const defaultOpts = {
  skip: ['S1'],
  sort: true,
  startingPosition: [0, 0],
  points: true
}

function JobOptimizer (_buffer, opts, config) {
  opts = Object.assign({}, defaultOpts, opts || {})
  let buffer = [..._buffer]

  const UP = `M1 ${config.pen_positions.up}`
  const DOWN = `M1 ${config.pen_positions.down}`
  const ptRegexp = new RegExp(`${UP},${DOWN},`, 'gi')

  let lines = bufferToLines(buffer)
  let sortedLines = opts.sort ? spatialSortLines(lines, opts.startingPosition) : lines
  let optimizedBuffer = linesToBuffer(sortedLines)
  optimizedBuffer.push('\n', '\0')

  return optimizedBuffer

  // create a lines array from a buffer, skipping point if opts.points is set to true
  function bufferToLines (buffer) {
    let lines = []
    for (let i = 0, drawing = false, line = [], lastUndrawnMove; i < buffer.length; i++) {
      if (buffer[i]) {
        let cmd = parse(buffer[i])

        // handle  non-decisive cmds
        if (cmd && ~opts.skip.indexOf(cmd.instruction)) {
          // @FIXME: handle sorting of non-decisive cmds
          // ie: if setSpeed is called at a specific point, how to keep its index relative to
          // the other commands ?
          // line.push(buffer[i])
          continue
        }

        if ((cmd && cmd.instruction === 'M') || cmd === null) { // handle [pen_up, pen_down, \n, \0] commands
          if (cmd === null || cmd.up) { // end of current path
            if (cmd) line.push(buffer[i])

            // skip points by handling position change if any
            if (opts.points && isPoint(line)) {
              // store the point as an undrawn move
              lastUndrawnMove = line.filter((cmd) => {
                return !~cmd.indexOf('M1')
              }).pop()
            } else {
              // add trailing pen_up if none found, to preserve consistency
              // during spatial sorting
              if (line.length && !~line.lastIndexOf(UP)) line.push(UP)

              // check for immobile pen_up / pen_down between two lines :
              // last line ends with pen_up, and current line begins with pen_down
              // if found, merge the two lines into one
              if (line[0] && ~line[0].indexOf(DOWN)) {
                if (!lines.length) lines.push(['G1 X0 Y0', DOWN])
                lines[lines.length - 1] = lines[lines.length - 1].concat(line).join(',').replace(ptRegexp, '').split(',')
              } else lines.push(line)
            }

            line = []
            drawing = false
          } else { // begining of a new path
            if (lastUndrawnMove) { // get last pen_up move position
              line.push(lastUndrawnMove)
              lastUndrawnMove = undefined
            }
            line.push(buffer[i])
            drawing = true
          }
        } else if (cmd && cmd.instruction === 'G') { // handle move commands
          if (drawing) line.push(buffer[i])
          else lastUndrawnMove = buffer[i] // store current pen_up move position
        }
      }
    }
    return lines
  }

  // create a buffer array from a lines buffer
  function linesToBuffer (lines) {
    let buffer = []
    sortedLines.forEach((line) => {
      if (line && Array.isArray(line)) {
        line.forEach((cmd) => {
          if (cmd) buffer.push(cmd)
        })
      }
    })
    return buffer
  }

  // sort lines from nearest to nearest
  function spatialSortLines (lines, startingPosition = [0, 0]) {
    let sortedLines = []
    for (let i = 0, position = startingPosition, l = lines.length; i < l; i++) {
      let index = nearest(position, lines)
      let line = lines[index]

      lines.splice(index, 1)
      sortedLines.push(line)
      position = getLasttPosition(line)
    }
    return sortedLines
  }

  // parse a command string into an object
  function parse (cmd) {
    if (typeof cmd === 'string' || cmd instanceof String) {
      let params = cmd.split(' ')

      if (~opts.skip.indexOf(params[0])) return {instruction: params[0]}

      if (params[0] === 'G1') {
        return {
          instruction: 'G',
          position: [
            parseFloat(params[1].split('X').pop()),
            parseFloat(params[2].split('Y').pop())
          ]
        }
      } else if (params[0] === 'M1') {
        return {
          instruction: 'M',
          up: (parseInt(params[1]) === 0)
        }
      } else return null
    } else return null
  }

  // return the index of the nearest line from given position
  function nearest (position, lines) {
    let index = -1
    for (let i = 0, record = Number.POSITIVE_INFINITY; i < lines.length; i++) {
      let linePosition = getFirstPosition(lines[i])
      if (linePosition) {
        let dist = distSq(linePosition, position)
        if (dist < record) {
          record = dist
          index = i
        }
      }
    }
    return index
  }

  // return the first meaningful position command of a line
  // as an array of coord [x, y]
  function getFirstPosition (line) {
    if (line && Array.isArray(line)) {
      let firstPosCmd = line.find((cmd, index) => {
        return ~cmd.indexOf('G1')
      })

      let parsed = parse(firstPosCmd)
      return parsed ? parsed.position : null
    } else return null
  }

  // return the last meaningful position command of a line
  // as an array of coord [x, y]
  function getLasttPosition (line) {
    // reverse mutates the array
    if (line && Array.isArray(line)) {
      let lastPosCmd = [...line].reverse().find((cmd, index) => {
        return ~cmd.indexOf('G1')
      })

      let parsed = parse(lastPosCmd)
      return parsed ? parsed.position : null
    } else return null
  }

  // return true if line contains two successive M1 instructions
  // (meaning that line is just a point)
  function isPoint (line) {
    return ~line.findIndex((cmd, index) => {
      return ~cmd.indexOf('M1') && (index < line.length - 1 && ~line[index + 1].indexOf('M1'))
    })
  }

  // return the distance squared between to [x, y] coords arrays
  function distSq (a, b) { return (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]) }
}

module.exports = JobOptimizer
