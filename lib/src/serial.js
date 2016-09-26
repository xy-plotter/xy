const SerialPort = require('serialport');
const sh         = require('kool-shell');
const progress   = require('cli-progress');

function Serial(address, _opts) {

  const opts = Object.assign({
    baudRate: 115200,
    verbose: false,
    progressBar: true,
    disconnectOnJobEnd: true,
  }, _opts);

  let port = new SerialPort(address, {
    baudRate: opts.baudRate,
    autoOpen: false,
    parser: SerialPort.parsers.readline('\n'),
  });

  const api = {
    connected: false,
    connect() {
      sh.info(`opening serialport ${address}...`);
      return new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) reject(new Error(err.message));
          else {
            sh.info(`waiting for handshake...`);
            port.on('data', (data) => {
              if (data.charAt(0) === 'N') {
                if (!api.connected) resolve('connected.');
              }
            });

            port.on('error', (err) => {
              reject(new Error(err, 'plotter.js'));
            });
          }
        });
      }).catch((err) => sh.error(err))
        .then((success) => {
          api.sendMessage('\n');
          api.connected = true;
          sh.success(success);
        });
    },

    disconnect() {
      return new Promise((resolve, reject) => {
        if (!api.connected) reject('already disconnected');
        else {
          port.close(() => {
            resolve('disconnected.')
          });
        }
      }).then((success) => {
        api.connected = false;
        sh.success(success);
      });
    },

    sendList(jobs) {
      return new Promise(function(resolve, reject) {
        let i = 0, len = jobs.length;
        (function iterate() {
          if (i >= len) return resolve();
          api.send(jobs[i]).then(()=>{ i++; iterate() });
        })();
      });
    },

    send(job) {
      if (!api.connected) {
        console.log('connecting...');
        return api.connect().then(() => api.send(job));
      } else {
        return new Promise((resolve, reject) => {
          let jobName = job.getName();
          let buffer = job.getBuffer();
          sh.warning(`starting ${jobName}...`);
          port.on('data', (data) => {
            if (buffer.length > 0) {
              let message = buffer.shift();
              // DEPRECATED
              // if (message === -1) {
                // if(job.callback) job.callback();
              // } else if (message) {
              if (message) {
                api.sendMessage(message);
                if (opts.progressBar) updateProgress(buffer.length, (opts.verbose ? message : null));
                else if (opts.verbose) sh.info(message);
              }
            } else resolve(`job "${jobName}" done.`);
          });
        }).then((success) => {
          if (opts.progressBar) progressBar.stop();
          sh.success(success);
          if (opts.disconnectOnJobEnd) return api.disconnect();
          // goHome to avoid plotter's position shifting
          else api.sendMessage('G28');
        });
      }
    },

    sendMessage(message) {
      if (port.isOpen) {
        port.write(`${message}\n`, (err) => {
          if (err) sh.error(new Error(err, 'plotter.js'));
        });
      } else sh.error(new Error('port isn\'t openned.', 'plotter.js'));
    },
  };

  let progressBar;
  function updateProgress(bufferLength, message = null) {
    if (progressBar) {
      if (message && message !== '\n') progressBar.format = `[{bar}] {percentage}% | {duration_formatted} ({eta_formatted}) [${message}]`;
      progressBar.increment();
    } else {
      progressBar = new progress.Bar({format: '[{bar}] {percentage}% | {duration_formatted} ({eta_formatted})'});
      progressBar.start(bufferLength, 0);
    }
  }

  return api;
}

module.exports = Serial;