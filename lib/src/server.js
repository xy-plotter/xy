const io = require('socket.io-client');

function Server(address, _opts) {
  const opts = Object.assign({
    port: 8080,
  }, _opts);

  const socket = io(`http://${address}:${opts.port}`);

  const api = {
    queue(job, cb = null) {
      sendSocketEvent('job', {
        name: job.getName(),
        buffer: job.getBuffer()
      }, cb);
      return api;
    },
  };

  function sendSocketEvent(event, data, cb = null) {
    socket.connect();
    socket.emit(event, data, function (validation) {
      if (cb) {
        if (validation) cb(true);
        else cb(false);
      }
      socket.disconnect();
    });
  }

  return api;
}

module.exports = Server;