const plotter = require('./../index.js')()

const turtle = plotter.Turtle('turtle')

turtle.down()

// ---------------------------------------

turtle.repeat(10, (turtle, repcount) => {
  turtle
    .up()
    .setXY(repcount * 10, 0)
    .down()
    .setXY(0, 110 - repcount * 10)
})

// ---------------------------------------

// turtle.setXY(10, -10)

// ---------------------------------------

// turtle.to('polygon', (turtle, sides, length) => {
//   turtle.repeat(sides, turtle => {
//     turtle.forward(length).right(360 / sides)
//   })
// })

// turtle.to('hexagonflower', (turtle, petals) => {
//   turtle.repeat(petals, turtle => {
//     turtle.polygon(5, 50).right(360 / petals)
//   })
// })

// turtle.hexagonflower(10)

// ---------------------------------------

// turtle.to('square', (turtle, length) => {
//   turtle.repeat(4, turtle => {
//     turtle
//       .forward(length)
//       .right(90)
//   })
// })

// turtle.square(10)

// ---------------------------------------

// turtle.repeat(100, (turtle, repcount) => {
//   turtle
//     .forward(repcount)
//     .right(60)
// })

// ---------------------------------------

// turtle.to('square', turtle => {
//   turtle.repeat(4, turtle => {
//     turtle
//       .forward(20)
//       .right(90)
//   })
// })
// turtle.square()

// ---------------------------------------

// turtle.to('fanblade', turtle => {
//   turtle.repeat(2, turtle => {
//     turtle
//       .forward(100)
//       .right(135)
//       .forward(20)
//       .right(45)
//   })
// })

// turtle.to('fan', turtle => {
//   turtle.repeat(8, turtle => {
//     turtle
//       .fanblade()
//       .left(135)
//       .forward(20)
//   })
// })

// turtle.fan()

// ---------------------------------------


// basic file export
plotter.File().export(turtle, require('path').join(__dirname, `${turtle.getName()}.png`));
