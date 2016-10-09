const plotter = require('./../index.js')();

const job1 = plotter.Job('small-rectangle');
job1.rect(10, 10, 10, 10).pen_up();

const job2 = plotter.Job('big-rectangle');
job2.rect(10, 10, 5, 5).pen_up();

const job3 = plotter.Job('circle');
job3.circle(10, 10, 3, 10).pen_up();


const serial = plotter.Serial('/dev/tty.wchusbserial1410', {
  verbose: true,
  progressBar: false,
  disconnectOnJobEnd: false, // set to false when queuing jobs (default true)
});


// you can make use of the promises to queue job...
serial
  .send(job1)
  .then(() => serial.send(job2))
  .then(() => serial.send(job3))
  // you'll need to disconnect manually, as serial.disconnectOnJobEnd is false
  .then(() => serial.disconnect());

// ...or use plotter.Serial.sendList([]);
// serial
  // .sendList([job1, job2, job3])
  // .then(() => serial.disconnect());
