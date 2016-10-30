const plotter = require('./../index.js')();

const job = plotter.Job('vortex');

let cx = plotter.width / 2;
let cy = plotter.height / 2;
let margin = 1;
let maxRadius = 100;
let sides = 100;

for (let r = 0; r < maxRadius; r += margin) {
  for (let a = 0; a <= Math.PI*2; a += (Math.PI*2 / sides)) {
    let d = (a < Math.PI) ? Math.PI : 0;
    let x = cx + Math.cos(a) * (r + Math.sin(d)*(maxRadius-r) );
    let y = cy + Math.sin(a) * (r + Math.cos(d)*(maxRadius-r) );
    job.move(x, y);
    job.pen_down();
  }
}

// sending the job to the server's queue
const server = plotter.Server('192.168.0.17');
server.queue(job, (success) => {
  if (success) console.log('job successfully queued');
});