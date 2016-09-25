module.exports = Object.assign({
  Job: require('./src/job'),
  Serial: require('./src/serial'),
  File: require('./src/file'),
  // Client: require('./src/client'),
}, require('./config.json'));
