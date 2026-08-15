module.exports = {
  Mode: require('./Mode'),
  Experiment: require('./Experiment'),
  Tournament: require('./Tournament')
};

module.exports.get = function(name) {
  switch (String(name).trim().toLowerCase()) {
    case "experiment":
      return new module.exports.Experiment();
    case "tournament":
      return new module.exports.Tournament();
    default:
      return null;
  }
};
