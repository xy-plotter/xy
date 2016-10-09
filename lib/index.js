const job    = require('./src/job');
const serial = require('./src/serial');
const file   = require('./src/file');
const stats  = require('./src/stats');
// const client = require('.src/client');

function Plotter(_config) {
  const config = Object.assign(require('./config.json'), _config);

  return {
    config : config,
    width  : config.width,
    height : config.height,
    Job    : function(jobName) { return job(jobName, config); },
    Serial : function(address, _opts) { return serial(address, _opts); },
    File   : function() { return file(config); },
    Stats  : function(job) { return stats(job, config) },
    // Client : function() { return client(); }
  };
}

module.exports = Plotter;