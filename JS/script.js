// IDEA: a realtime simulation of gravity between objects
// ctx.scale can be used to zoom in and out
// Get the canvas element from the page
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

/*
  resize the canvas to occupy the full page,
  by getting the widow width and height and setting it to canvas
*/
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;


var activeBodies = [];
var selectedBody = {};
var lastUpdate = Date.now();
var dt = 0;
var km = ((canvas.width + canvas.height) / 2) / 10000;
var g = 6.67E-11;

class Body {
  constructor (position, radius, velocity, acceleration, mass) {
    this.p = position || [0, 0];
    this.r = radius || 10;
    this.v = velocity || [0, 0];
    this.a = acceleration || [0, 0];
    this.m = mass || 6.0E24;
  }

  render () {
    /*
    arc parameters
    x The x-coordinate of the center of the circle
    y The y-coordinate of the center of the circle
    r The radius of the circle
    sAngle The starting angle, in radians (0 is at the 3 o'clock position of the arc's circle)
    eAngle The ending angle, in radians
    */
    ctx.arc(this.p[0], this.p[1], this.r, 0, 2 * Math.PI);
    this.v[0] += this.a[0] * dt;
    this.v[1] += this.a[1] * dt;
    this.p[0] += this.v[0] * dt;
    this.p[1] += this.v[1] * dt;
  }
}

// takes two bodies and calculates gravity's effect
function gravity (a, b) {
  // F = G * (m1 * m2) / r * r
  var xd = Math.abs(a.x - b.x) * km;
  var yd = Math.abs(a.y - b.y) * km;
  var distance = Math.sqrt(xd * xd + yd * yd);
  var force = g * ((a.m * b.m) / (distance * distance));

  // apply force in the direction of other object
  // direction towards a as -> [x, y] vector
  var direction = [(b.x - a.x) * km / xd, (b.y - a.y) * km / xd];

  // b vector changed to head towards a using direction_a with velocity
  a.vl += (force / a.mass) / dt;
  a.v[0] = direction[0];
  a.v[1] = direction[1];

  /* include
  // same thing but opposite
  var direction_b = [(b.x - a.x) / xd, (b.y - a.y) / xd];
  a.v[0] += direction_b[0] * force;
  a.v[1] += direction_b[1] * force;
  */
}

// takes two bodies and tests collision
function collide (a, b) {
  // find distance between bodies
  var xd = Math.abs(a.x - b.x);
  var yd = Math.abs(a.y - b.y);
  if (xd <= a.r + b.r && yd <= a.r + b.r) {
    return true;
  }
}

// gameloop
var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}
function init () {
  activeBodies.push(new Body([100, 300], 10, [0, 0], [0, 0], 1E10));
  activeBodies.push(new Body([1000, 300], 10, [0, 0], [0, 0], 1E10));
}

function gameloop () {
  window.requestAnimationFrame(gameloop);
  var now = Date.now();
  dt = (now - lastUpdate) * 0.001;
  lastUpdate = now;

  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // rendering
  ctx.beginPath();
  for (var x = 0; x < activeBodies.length; x++) {
    activeBodies[x].render();
    for (var y = 0; y < activeBodies.length; y++) {
      // gravity(activeBodies[x], activeBodies[y]);

      /*
      if (collide(activeBodies[i], activeBodies[foo]) === true) {
        console.log('collision');
      }
      */
    }
  }
  // tests if selected body is initialized with a body type if so render
  if (selectedBody.hasOwnProperty('r')) {
    selectedBody.render();
  }
  ctx.fill();
}

init();
gameloop();
