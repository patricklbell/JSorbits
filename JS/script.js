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
var fps = 30;
var interval = 1000 / fps;
var dt = 0;
var scale = 800000000;
var G = 6.67E-11;

class Body {
  constructor (position, radius, velocity, acceleration, mass) {
    this.p = position || [0, 0];
    this.r = radius || 10;
    this.v = velocity || [0, 0];
    this.a = acceleration || [0, 0];
    this.m = mass || 6.0E24;
  }

  render () {
    ctx.arc(this.p[0] / scale, this.p[1] / scale, this.r, 0, 2 * Math.PI);
    this.v[0] += this.a[0] * dt;
    this.v[1] += this.a[1] * dt;
    this.p[0] += this.v[0] * dt;
    this.p[1] += this.v[1] * dt;
  }
}

function vectorAdd (V1, V2) {
  return [V1[0] + V2[0], V1[1] + V2[1]];
}

function vectorScale (V1, S1) {
  return [V1[0] * S1, V1[1] * S1];
}

function vectorNegate (V) {
  return vectorScale(V, -1);
}

function sqrtMagnitude (V) {
  return Math.pow(V[0], 2) + Math.pow(V[1], 2);
}

// takes two bodies and calculates gravity's effect
function gravity (a, b) {
  var r2 = sqrtMagnitude(vectorAdd(a.p, vectorNegate(b.p)));
  if (r2 === 0) {
    r2 = 1E-10;
    console.warn('uh oh!');
  }

  var mFg = (G * a.m * b.m) / r2;

  var dir = vectorAdd(b.p, vectorNegate(a.p));
  console.dir(JSON.stringify(dir));
  dir = vectorScale(dir, 1 / Math.sqrt(sqrtMagnitude(dir)));

  var Fg = vectorScale(dir, mFg);

  // Fnet = ma
  a.a = vectorScale(Fg, 1 / a.m);
  b.a = vectorScale(vectorScale(Fg, -1), 1 / a.m);
  /*
  if (r2 < 25) {
    try {
      throw 'meme';
    } catch (e) {
      console.log('sandos');
    }
  }
  */

  // because dt is not infinitesimal
  // by the time two bodies get very close their velocity is enormous
  // but as they pass over the acceleration in the opposite direction should counteract that right?
  // no. Because when the next call to gravity is made their position has changed
  // so do a pre and post call
}

function PEcalc (a) {
  // calculates the gravitational potential energy between the objects
  // then set the velocity so that kinetic energy is less or = to the gravitational PE
}

// takes two bodies and tests collision
function collide (a, b) {
  // find distance between bodies
  var dis = Math.abs(vectorAdd(b.p, vectorNegate(a.p)));
  console.log('dis: ' + dis);

  if (dis <= a.r + b.r) {
    return true;
  } else {
    return false;
  }
}

// gameloop
var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}
function init () {
  // Sol
  activeBodies.push(new Body([canvas.width / 2 * scale, canvas.height / 2 * scale], 10, [0, 0], [0, 0], 1E30));
  // Earth
  activeBodies.push(new Body([canvas.width / 2 * scale + 1496E8, canvas.height / 2 * scale], 10, [0, 30000], [0, 0], 1E24));
}

function gameloop () {
  window.requestAnimationFrame(gameloop);
  var now = Date.now();
  dt = (now - lastUpdate) * 10;
  lastUpdate = now;

  if (dt / 10 > interval) {

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // rendering
    ctx.beginPath();
    for (var x = 0; x < activeBodies.length; x++) {
      for (var y = 0; y < activeBodies.length; y++) {
        if (x !== y) {
          // if (collide(activeBodies[x], activeBodies[y]) === false) {
          gravity(activeBodies[x], activeBodies[y]);
          // } else {
          //   // position, radius, velocity, acceleration, mass
          //   var temp = new Body(
          //     [(activeBodies[x].p[0] + activeBodies[y].p[0]) / 2,
          //       (activeBodies[x].p[1] + activeBodies[y].p[1]) / 2],
          //     activeBodies[x].r + activeBodies[y].r,
          //     [(activeBodies[x].v[0] + activeBodies[y].v[0]) / 2,
          //       (activeBodies[x].v[1] + activeBodies[y].v[1]) / 2],
          //     [(activeBodies[x].a[0] + activeBodies[y].a[0]) / 2,
          //       (activeBodies[x].a[1] + activeBodies[y].a[1]) / 2],
          //     activeBodies[x].d + activeBodies[y].d
          //   );
          //   activeBodies.splice(x, 1, temp);
          //   activeBodies.splice(y, 1);
          // }
        }
      }
    }

    for (x = 0; x < activeBodies.length; x++) {
      activeBodies[x].render();
    }

    // tests if selected body is initialized with a body type if so render
    if (selectedBody.hasOwnProperty('r')) {
      selectedBody.render();
    }
    ctx.fill();
  }
}

init();
gameloop();
