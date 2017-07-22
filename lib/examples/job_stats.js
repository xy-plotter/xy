const plotter = require('./../index.js')()

const job = plotter.Job('rectangles')

let margin = 1
let startX = plotter.width / 2
let startY = plotter.height / 2 + margin
let x = startX
let y = startY

job.move(startX, startY)
job.pen_down()
for (let i = 0; i < 100; i += margin) {
  x = startX
  x += i
  job.move(x, y)

  y += i * 2
  job.move(x, y)

  x -= i * 2
  job.move(x, y)

  y -= i * 2 + margin
  job.move(x, y)

  y = startY - i
}
job.pen_up()

const stats = plotter.Stats(job)
const duration = stats.duration
console.log(`Some stats before starting "${job.name}" :`)
console.log(`the pen will run a total of ${stats.distance} mm,`)
console.log(`in about ${duration.estimation.value} seconds (${duration.estimation.formatted}).`)
console.log(`Let's say between ${duration.min.formatted} and ${duration.max.formatted} to be sure.`)
console.log(`Now let's draw !\n`)

const serial = plotter.Serial('/dev/tty.wchusbserial1410')
serial.send(job)
