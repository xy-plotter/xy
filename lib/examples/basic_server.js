const plotter = require('./../index.js')();

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
    let x = cy + dx + Math.cos(a) * Math.max(r + dr , dx);
    let y = cx + dx - dy + Math.sin(a) * Math.max(r + dr, r + dy);
    job.move(y, x);
    job.pen_down();
  }
}

// sending the job to the server's queue
const server = plotter.Server('192.168.0.17');
server.queue(job, (success) => {
  if (success) console.log('job successfully queued');
});