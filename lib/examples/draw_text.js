const plotter = require('./../index.js')()

const job = plotter.Job('text-test')

job.text('hello world !', 100, 100, {fontSize: 12})
job.text('20161016', 200, 100)
job.text('2016-10-16', 200, 120)

job.text('20161016', 200, 140, {fontSize: 4})
job.text('2016-10-16', 200, 160, {fontSize: 4})

// writing to a png file
const path = require('path')
const file = plotter.File()
file.export(job, path.join(__dirname, 'text-test.png'))

// anonymous call to serial
plotter.Serial('/dev/tty.wchusbserial1410').send(job)
