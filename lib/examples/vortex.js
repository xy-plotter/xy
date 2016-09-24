const plotter = require('./../index.js').Plotter;
plotter.connect('/dev/tty.wchusbserial1410', 115200);

let cx = plotter.WIDTH / 2;
let cy = plotter.HEIGHT / 2;
let margin = 1;
let maxRadius = 100;
let sides = 100;

for (let r = 0; r < maxRadius; r += margin) {
  for (let a = 0; a <= Math.PI*2; a += (Math.PI*2 / sides)) {
    let d = (a < Math.PI) ? Math.PI : 0;
    let x = cx + Math.cos(a) * (r + Math.sin(d)*(maxRadius-r) );
    let y = cy + Math.sin(a) * (r + Math.cos(d)*(maxRadius-r) );
    plotter.move(x, y);
    plotter.pen_down();
  }
}

plotter.end(() => plotter.disconnect());