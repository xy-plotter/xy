const sh = require('kool-shell');
const plotter = require('./libs/plotter');

plotter.connect('/dev/tty.wchusbserial1410', 115200)
  .catch((err) => {
    sh.error(err);
    exit(1);
  });

plotter.move(100, 100);
plotter.pen_down();
plotter.move(200, 100);
plotter.pen_up();
plotter.move(100, 100);
plotter.pen_down();
plotter.move(200, 100);
plotter.home();
plotter.move(100, 100);
plotter.move(200, 100);
plotter.move(100, 100);