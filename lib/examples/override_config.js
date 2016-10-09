const plotter = require('./../index.js')({
  width: 380,
  height: 310,
  pen_positions: {
    up: 0,
    down: 80
  },
  decimals: 2
});

console.log(plotter.width, plotter.height);

console.log(plotter.config);
console.log(plotter.defaultConfig);