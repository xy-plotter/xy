const fs       = require('fs');
const _path    = require('path');
const sh       = require('kool-shell');
const Canvas   = require('canvas');
const Image    = Canvas.Image;
const jsonfile = require('jsonfile');
const Job      = require('./job.js');

function File(config) {

  const api = {
    export(job, path, _opts) {
      if (job) {
        const opts = Object.assign({
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

        path = path || _path.join(__dirname, job.getName() + '.png');

        let buffer = job.getBuffer();
        let out = fs.createWriteStream(path);
        let stream = canvas.pngStream();

        sh.info(`writing ${path}...`);
        stream.on('data', (chunk) => out.write(chunk));

        ctx.fillStyle = opts.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = opts.stroke; // used to draw points
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
                  ctx.closePath();
                }
                break;
              case 'M' :
                if (penIsUp && !cmd.up) ctx.fillRect(x - opts.strokeWeight / 2, y - opts.strokeWeight / 2, opts.strokeWeight, opts.strokeWeight);
                penIsUp = cmd.up;
                break;
            }
          }
        }

        stream.on('end', () => sh.success(`${path} successfully written !`));
      } else {
        sh.error(new Error('job undefined'));
      }
    },

    save(job, path) {
      let jobName = job.getName();
      path = path || _path.join(__dirname, jobName + '.json');

      sh.info(`saving ${path}...`);
      jsonfile.writeFileSync(path, job.getBuffer());
      sh.success(`${jobName} successfully saved to ${path} (${getFilesizeInKiloBytes(path)}kb)`);
    },

    load(path) {
      try {
        let jobName = _path.basename(path).replace(/\.[^/.]+$/, "");
        sh.info(`loading ${path}...`);
        let buffer = jsonfile.readFileSync(path);
        sh.success(`${jobName} successfully loaded !`);

        return Job(jobName).setBuffer(buffer);
      } catch (e) {
        sh.error(e);
        return null;
      }
    }
  };

  function parse(message) {
    if (typeof message === 'string' || message instanceof String) {
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
          up: (params[1] == config.pen_positions.up),
        };
        return cmd;
      } else return null;
    } else return null;
  }

  function getFilesizeInKiloBytes(filename) {
    let stats = fs.statSync(filename);
    let fileSizeInBytes = stats["size"];
    return Math.ceil(fileSizeInBytes / 1000);
  }

  return api;
}

module.exports = File;