const sh = require('kool-shell');
const plotter = require('./../index.js');
const job = plotter.Job('red-and-blue-rectangle');

// draw a first rectangle
job.rect(50, 50, 20, 20).pen_up();

// wait until user resume the job
job.wait();

// draw a second rectangle with another pen
job.rect(55, 55, 20, 20);

// anonymous call to serial
plotter.Serial('/dev/tty.wchusbserial1410').send(job);