const plotter = require('./../index.js')()

plotter.on('error', (err) => console.log(err))

plotter.on('connect', () => console.log('connect'))
plotter.on('disconnect', () => console.log('disconnect'))

plotter.on('pause', () => console.log('pause'))
plotter.on('resume', () => console.log('resume'))

plotter.on('job-start', (data) => console.log('job-start', data))
plotter.on('job-progress', (data) => console.log('job-progress', data))
plotter.on('job-done', (data) => console.log('job-done', data))
