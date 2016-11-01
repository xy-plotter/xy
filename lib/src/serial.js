const SerialPort = require('serialport');
const sh         = require('kool-shell');
const progress   = require('cli-progress');

function Serial(address, _opts, emitter) {

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
    paused: false,

    pause() {
      api.paused = true;
      emitter.emit('pause');
      return api;
    },

    resume() {
      api.paused = false;
      emitter.emit('resume');
      port.emit('data');
      return api;
    },

    connect() {
      sh.info(`opening serialport ${address}...`);
      return new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) {
            sh.error(err);
            emitter.emit('error', new Error(err.message));
            reject(new Error(err.message));
          } else {
            sh.info(`waiting for handshake...`);
            port.on('data', onData);
            function onData(data) {
              if (data.charAt(0) === 'N') {
                if (!api.connected) {
                  api.sendMessage('\n');
                  api.connected = true;
                  sh.success('connected.');
                  emitter.emit('connect');

                  port.removeListener('data', onData);
                  resolve('connected.');
                }
              }
            }

            port.on('error', (err) => {
              sh.error(err);
              emitter.emit('error', new Error(err));
              reject(new Error(err, 'plotter.js'));
            });
          }
        });
      });
    },

    disconnect() {
      return new Promise((resolve, reject) => {
        port.close(() => {
          api.connected = false;
          sh.success('disconnected.');
          emitter.emit('disconnect');
          resolve();
        });
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
        return api.connect().then(() => api.send(job));
      } else {
        return new Promise((resolve, reject) => {
          let jobName = job.getName();
          let buffer = job.getBuffer();
          let bufferTotal = buffer.length;

          sh.warning(`starting ${jobName}...`);
          emitter.emit('job-start', {job: job});
          port.on('data', onData);

          function onData(data) {
            if (buffer.length > 0) {
              if (!api.paused) {
                let cmd = buffer.shift();

                // DEPRECATED
                // if (cmd === -1) {
                  // if(job.callback) job.callback();
                // } else
                if (cmd) {
                  if (cmd instanceof Function) {
                    emitter.emit('pause');
                    port.removeListener('data', onData);
                    if (opts.progressBar) progressBar.stop();
                    cmd().then(() => {
                      emitter.emit('resume');
                      if (opts.progressBar) updateProgress(buffer.length);
                      api.sendMessage('\n')
                      port.on('data', onData);
                    });
                  } else {
                    if (opts.progressBar) updateProgress(buffer.length, (opts.verbose ? cmd : null));
                    else if (opts.verbose) sh.info(cmd);
                    emitter.emit('job-progress', {
                      job: job,
                      cmd: cmd,
                      progress: {
                        total: bufferTotal,
                        elapsed: bufferTotal - buffer.length,
                        remaining: buffer.length,
                      }
                    });
                    api.sendMessage(cmd);
                  }
                }
              }
            } else {
              if (opts.progressBar) progressBar.stop();
              sh.success(`job "${jobName}" done.`);
              emitter.emit('job-done', {job: job});
              port.removeListener('data', onData);
              if (opts.disconnectOnJobEnd) api.disconnect().then(() => resolve());
              else {
                // goHome to avoid plotter's position shifting
                api.sendMessage('G28').then(() => resolve());
              }
            }
          }
        });
      }
    },

    sendMessage(message) {
      return new Promise((resolve, reject) => {
        if (port.isOpen) {
          port.write(`${message}\n`, (err) => {
            if (err) {
              sh.error(err);
              emitter.emit('error', new Error(err));
              reject(new Error(err));
            } else {
              resolve();
            }
          });
        } else {
          let err = new Error('port is not open', 'serial.js');
          sh.error(err);
          emitter.emit('error', new Error(err));
          reject(err);
        }
      });
    },
  };

  let progressBar;
  function updateProgress(bufferLength, message = null) {
    if (progressBar) {
      if (message && message !== '\n') progressBar.format = `[{bar}] {percentage}% | {duration_formatted} [${message}]`;
      progressBar.increment();
    } else {
      progressBar = new progress.Bar({format: '[{bar}] {percentage}% | {duration_formatted}'});
      progressBar.start(bufferLength, 0);
    }
  }

  return api;
}

module.exports = Serial;