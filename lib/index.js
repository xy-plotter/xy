module.exports = Object.assign({
  Job: require('./src/job'),
  Serial: require('./src/serial'),
  // Client: require('./src/client'),
}, require('./config.json'));
