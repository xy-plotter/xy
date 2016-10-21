const plotter = require('./../index.js')();
const path = require('path');

const job = plotter.Job('hello');

let x = plotter.width / 2;
let y = plotter.height / 2;

for (let i = 0; i <= 360; i+=20) {
  job.svg(path.join(__dirname, 'hello.svg'), {
    x: x,
    y: y,
    width: plotter.width / 3,
    angle: i,
    origin: {x: 0, y: 0.5}
  });
}

// writing to a png file
const file = plotter.File();
file.export(job, path.join(__dirname, 'hello.png'));

// anonymous call to serial
plotter.Serial('/dev/tty.wchusbserial1410').send(job);