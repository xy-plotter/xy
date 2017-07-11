const path = require('path')
const plotter = require('./../index.js')()
const job = plotter.Job('lot-of-strokes')

for (let i = 0; i < 100; i++) {
  if (prob(50)) job.pen_up()
  else job.pen_down()

  if (prob(50)) job.pen_up()
  else job.pen_down()

  // @FIXME: handle sorting of non-decisive cmds
  // ie: if setSpeed is called at a specific point, how to keep
  // its index relative to the other commands ?
  if (prob(100)) job.setSpeed(Math.random())

  let a = randomPoint()
  job.move(a.x, a.y)

  if (prob(50)) job.pen_up()
  else job.pen_down()
}

const file = plotter.File()
echoStats(job)
file.export(job, path.join(__dirname, 'unoptimized.png'), {strokeWeight: 10})

job.optimize({
  sort: true,
  points: true,
  startingPosition: [0, 0]
})

echoStats(job)
file.export(job, path.join(__dirname, 'optimized.png'), {strokeWeight: 10})

// -------------------------------------------------------------------------

function prob (percent) { return (percent > Math.random() * 100) }

function randomPoint () {
  return {
    x: Math.floor(Math.random() * plotter.width),
    y: Math.floor(Math.random() * plotter.height)
  }
}

function echoStats (job) {
  let stats = plotter.Stats(job)
  let duration = stats.getDuration()
  console.log(`Some stats before starting "${job.getName()}" :`)
  console.log(`the pen will run a total of ${stats.getDistance()} mm,`)
  console.log(`in about ${duration.estimation.value} seconds (${duration.estimation.formatted}).`)
  console.log(`Let's say between ${duration.min.formatted} and ${duration.max.formatted} to be sure.`)
  console.log(`Now let's draw !`)
}
