const sh = require('kool-shell');
const plotter = require('./libs/plotter');

plotter
  .connect('/dev/tty.wchusbserial1410', 115200)
  .catch((err) => {
    sh.error(err);
    exit(1);
  });


let margin = 1;
let startX = plotter.WIDTH / 2;
let startY = plotter.HEIGHT / 2 + margin;
let x = startX;
let y = startY;

plotter.move(startX, startY);
plotter.pen_down();
for (let i = 0; i < 100; i += margin) {
  x = startX;
  x += i;
  plotter.move(x, y);

  y += i * 2;
  plotter.move(x, y);

  x -= i * 2;
  plotter.move(x, y);

  y -= i * 2 + margin;
  plotter.move(x, y);

  y = startY - i;
}
plotter.pen_up();

plotter.end(() => plotter.disconnect());