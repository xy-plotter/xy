'use strict'

const benchmark = {
  // benchmark with a movement distance of 380mm
  duration: [
    // depending on the length of the segment, the default none-linear
    // duration varies between 10s and 36s, averaging to 23s
    {speedSetting: null, seconds: 23, min: 10, max: 36},
    // linear speeds
    {speedSetting: 0.1, seconds: 35},
    {speedSetting: 0.2, seconds: 32},
    {speedSetting: 0.3, seconds: 28},
    {speedSetting: 0.4, seconds: 25},
    {speedSetting: 0.5, seconds: 22},
    {speedSetting: 0.6, seconds: 18},
    {speedSetting: 0.7, seconds: 15},
    {speedSetting: 0.8, seconds: 12},
    {speedSetting: 0.9, seconds: 8},
    {speedSetting: 1.0, seconds: 5}
  ],
  speed: {
    values: [
      // depending on the length of the segment, the default non-linear speed
      // varies between 10.56mm/s and 38mm/s, averaging to 24.28mm/s
      {speedSetting: null, mmPerSecond: 24.28, min: 10.56, max: 38},
      // linear speeds
      {speedSetting: 0.1, mmPerSecond: 10.86},
      {speedSetting: 0.2, mmPerSecond: 11.88},
      {speedSetting: 0.3, mmPerSecond: 13.57},
      {speedSetting: 0.4, mmPerSecond: 15.2},
      {speedSetting: 0.5, mmPerSecond: 17.27},
      {speedSetting: 0.6, mmPerSecond: 21.11},
      {speedSetting: 0.7, mmPerSecond: 25.33},
      {speedSetting: 0.8, mmPerSecond: 31.67},
      {speedSetting: 0.9, mmPerSecond: 47.5},
      {speedSetting: 1.0, mmPerSecond: 76}
    ],
    interpolate: (x) => { return 1.3145 * Math.exp(3.8312 * x) + 7.5435 },
    lerp: (x) => { return 58.2018 - x }
  }
}

module.exports = benchmark
