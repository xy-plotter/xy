const plotter = require('./../index.js');

const job = plotter.Job('small-rectangle');
job.rect(10, 10, 10, 10).pen_up();

const job2 = plotter.Job('big-rectangle');
job2.rect(100, 100, 100, 100);


const serial = plotter.Serial('/dev/tty.wchusbserial1410', {
  verbose: true,
  progressBar: true,
  disconnectOnJobEnd: false, // set to false when queuing jobs (default true)
});

serial
  .send(job)
  .then(() => serial.send(job2))
  // you need to disconnect manually, as serial.disconnectOnJobEnd is false
  .then(() => serial.disconnect());