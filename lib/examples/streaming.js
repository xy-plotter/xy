const plotter = require('./../index.js')()
const sh = require('kool-shell')()
      sh.use(require('kool-shell/plugins/input'))

const job = plotter.Job('realtime-random-strokes')

const serial = plotter.Serial('/dev/tty.wchusbserial1410')

// manually connect and use Promise.resolve to begin interval
// when the plotter is ready, whereas when the script starts
serial.connect().then(() => {
  serial
    .send(job, true)
    .then(j => {
      console.log(`'${j.getName()}' has ended.`)
      clearInterval(randomStrokes)
    })

  let randomStrokes = setInterval(() => {
    let x = Math.random() * plotter.width
    let y = Math.random() * plotter.height
    job.pen_down().move(x, y)
  }, 3000)

  // end the stream one minute after it starts
  setTimeout(() => serial.end(job), 60000)
})
