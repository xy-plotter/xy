const config = require('./../config.json');

function Stats(job) {

  const cmds = parse(job.getBuffer());
  const benchmark = {
    // benchmark with a movement distance of 380mm
    duration: [
      // depending on the length of the segment, the default none-linear
      // duration varies between 10s and 36s, averaging to 23s
      {speedSetting: null, seconds: 23, min: 10, max: 36},
      // linear speeds
      {speedSetting:  0.1, seconds: 35},
      {speedSetting:  0.2, seconds: 32},
      {speedSetting:  0.3, seconds: 28},
      {speedSetting:  0.4, seconds: 25},
      {speedSetting:  0.5, seconds: 22},
      {speedSetting:  0.6, seconds: 18},
      {speedSetting:  0.7, seconds: 15},
      {speedSetting:  0.8, seconds: 12},
      {speedSetting:  0.9, seconds: 8},
      {speedSetting:  1.0, seconds: 5},
    ],
    speed: {
      values: [
        // depending on the length of the segment, the default non-linear speed
        // varies between 10.56mm/s and 38mm/s, averaging to 24.28mm/s
        {speedSetting: null, mmPerSecond: 24.28, min: 10.56, max: 38},
        // linear speeds
        {speedSetting:  0.1, mmPerSecond: 10.86},
        {speedSetting:  0.2, mmPerSecond: 11.88},
        {speedSetting:  0.3, mmPerSecond: 13.57},
        {speedSetting:  0.4, mmPerSecond: 15.2},
        {speedSetting:  0.5, mmPerSecond: 17.27},
        {speedSetting:  0.6, mmPerSecond: 21.11},
        {speedSetting:  0.7, mmPerSecond: 25.33},
        {speedSetting:  0.8, mmPerSecond: 31.67},
        {speedSetting:  0.9, mmPerSecond: 47.5},
        {speedSetting:  1.0, mmPerSecond: 76},
      ],
      interpolate: function(x) { return 1.3145 * Math.exp(3.8312 * x) + 7.5435; },
      lerp: function(x) { return 58.2018 - x; },
    },
  };

  const api = {
    getDistance() { return distance; },
    getDuration() { return duration; },
    getBenchmark() { return benchmark; },
  };

  const distance = calcDistance(cmds);
  const duration = calcDuration(cmds);

  function calcDistance(cmds) {
    let dist = 0;
    let px = 0, py = 0;
    for (let i = 0; i < cmds.length; i++) {
      let cmd = cmds[i];
      if (cmd && cmd.instruction === 'G') {
        let x = cmd.x;
        let y = cmd.y;
        dist += Math.sqrt( (x-px)*(x-px) + (y-py)*(y-py) );
        px = x;
        py = y;
      }
    }
    return dist;
  }

  function calcDistanceAndDuration(cmds) {
    return {distance: 0, duration: 0};
  }

  function calcDuration(cmds) {
    let
      duration = 0,
      variation = {min: 0, max: 0},
      dist = 0, px = 0, py = 0, speed;

    for (let i = 0; i < cmds.length; i++) {
      let cmd = cmds[i];
      if (cmd) {
        if (cmd.instruction === 'G') {
           let x = cmd.x;
           let y = cmd.y;
           dist += Math.sqrt( (x-px)*(x-px) + (y-py)*(y-py) );
           px = x;
           py = y;
        } else if (cmd.instruction === 'S') {
          duration += calcDuration(dist, speed);

          if (!speed) {
            variation.min += dist / benchmark.speed.values[0].max;
            variation.max += dist / benchmark.speed.values[0].min;
            speed = null;
          } else {
            // see Plotter.Job.setSpeed() for the equation
            speed = (1100 - cmd.speed) / 1000;
          }
          dist = 0;
        }
      }
    }

    if (dist > 0) duration += calcDuration(dist, speed);

    function calcDuration(dist, speed) {
      if (speed) return dist / benchmark.speed.interpolate(speed);
      else return dist / benchmark.speed.values[0].mmPerSecond;
    }

    function secondToTime(seconds) {
      let date = new Date(null);
      date.setSeconds(seconds);
      return date.toISOString().substr(11, 8);
    }

    duration = round(duration, 0);
    variation.min = round(variation.min, 0);
    variation.max = round(variation.max, 0);

    return {
      raw: {
        estimation : duration,
        min : variation.min ? variation.min : duration - duration * 0.1,
        max : variation.max ? variation.max : duration + duration * 0.1,
      },
      formatted: {
        estimation : secondToTime(duration),
        min : variation.min ? secondToTime(variation.min) : secondToTime(duration - duration * 0.1),
        max : variation.max ? secondToTime(variation.max) : secondToTime(duration + duration * 0.1),
      },
    };
  }

  function parse(buff) {
    let cmds = [];
    for (let i = 0; i < buff.length; i++) {
      let cmd = parseCMD(buff[i]);
      cmds.push(cmd);
    }

    return cmds;
  }

  function parseCMD(message) {
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
    } else if (params[0] === 'S0') {
      let cmd = {
        instruction: 'S',
        speed: null,
      };
      return cmd;
    } else if (params[0] === 'S1') {
      let cmd = {
        instruction: 'S',
        speed: parseFloat(params[1]),
      };
      return cmd;
    } else return null;
  }

  function round(a, d = 3) { return +a.toFixed(d); }

  return api;
}

module.exports = Stats;