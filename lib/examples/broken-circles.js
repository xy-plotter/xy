const plotter = require('./../index.js');

const job = plotter.Job('broken-circles');

let cx = plotter.width / 2;
let cy = plotter.height / 2;
let margin = 1;
let sides = 100;

for (let r = 2; r < 100; r += margin) {
  for (let a = 0; a <= Math.PI*2; a += (Math.PI*2 / sides)) {
    let dx = (a < Math.PI) ? 50 : -20;
    let dy = (a > Math.PI) ? 20 : 50;
    let dr = (a > Math.PI * 0.25 && a < Math.PI * 1) ? -50 : 0;
    let x = cx + dx + Math.cos(a) * Math.max(r + dr , dx);
    let y = cy + dx - dy + Math.sin(a) * Math.max(r + dr, r + dy);
    job.move(x, y);
    job.pen_down();
  }
}


const serial = plotter.Serial('/dev/tty.wchusbserial1410', {verbose: true, progressBar: false});
serial.send(job);