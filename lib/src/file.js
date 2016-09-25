const fs     = require('fs');
const _path  = require('path');
const sh     = require('kool-shell');
const Canvas = require('canvas');
const Image  = Canvas.Image;
const config = require('./../config.json');

function File(_opts) {

  const opts = Object.assign({
    path: __dirname,
    extension: '.png',
    width: config.width,
    height: config.height,
    scale: 4,
    stroke: '#000',
    background: '#FFF',
    strokeWeight: 1,
  }, _opts);

  let canvas = new Canvas(opts.width * opts.scale, opts.height * opts.scale);
  let ctx = canvas.getContext('2d');

  const api = {
    write(job, path) {
      path = path || _path.join(opts.path, job.getName() + opts.extension)

      let buffer = job.getBuffer();
      let out = fs.createWriteStream(path);
      let stream = canvas.pngStream();

      sh.info(`writing ${path}...`);
      stream.on('data', (chunk) => out.write(chunk));

      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = opts.stroke;
      ctx.strokeWeight = opts.strokeWeight;

      let x = 0;
      let y = 0;
      let penIsUp = true;

      for (let i = 0; i < buffer.length; i++) {
        let message = buffer[i];
        let cmd = parse(message);
        if (cmd) {
          switch (cmd.instruction) {
            case 'G' :
              if (penIsUp) {
                x = cmd.x * opts.scale;
                y = cmd.y * opts.scale;
                ctx.moveTo(x, y);
              } else {
                ctx.beginPath();
                ctx.moveTo(x, y);
                x = cmd.x * opts.scale;
                y = cmd.y * opts.scale;
                ctx.lineTo(x, y);
                ctx.stroke();
              }
              break;
            case 'M' :
              penIsUp = cmd.up;
              break;
          }
        }
      }

      stream.on('end', () => sh.success(`${path} successfully written !`));
    },
  };

  function parse(message) {
    let params = message.split(' ');
    if (params[0] === ('G1')) {
      let cmd = {
        instruction: 'G',
        x: parseFloat(params[1].split('X').pop()),
        y: parseFloat(params[2].split('Y').pop()),
      };
      return cmd;
    } else if (params[0] === 'M1') {
      let cmd = {
        instruction: 'M',
        up: (params[1] === 0),
      };
      return cmd;
    } else return null;
  }

  return api;
}

module.exports = File;