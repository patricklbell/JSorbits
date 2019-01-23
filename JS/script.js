// IDEA: a realtime simulation of gravity between objects

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
var holdStart = null;
var holdTime = null;
var fps = 30;
var interval = 1000 / fps;
var dt = 0;
var scale = 800000000;
var xPos = 0;
var yPos = 0;
var zoom = 1;
var time = 10000;
var G = 6.67E-11;
var pause = false;

class Body {
  constructor (position, radius, velocity, acceleration, mass) {
    this.p = position || [0, 0];
    this.r = radius || 10;
    this.v = velocity || [0, 0];
    this.a = acceleration || [0, 0];
    this.m = mass || 1E29;
  }

  apply () {
    this.v[0] += this.a[0] * dt;
    this.v[1] += this.a[1] * dt;
    this.p[0] += this.v[0] * dt;
    this.p[1] += this.v[1] * dt;
  }

  render (colour) {
    colour = colour || '#000000';
    ctx.beginPath();
    ctx.arc(this.p[0] / scale, this.p[1] / scale, this.r, 0, 2 * Math.PI);
    ctx.fillStyle = colour;
    ctx.fill();
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

function vectorDot (V1, V2) {
  return V1[0] * V2[0] + V1[1] * V2[1];
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
  // console.dir(JSON.stringify(dir));
  dir = vectorScale(dir, 1 / Math.sqrt(sqrtMagnitude(dir)));

  var Fg = vectorScale(dir, mFg);

  // Fnet = ma
  a.a = vectorScale(Fg, 1 / a.m);
  b.a = vectorScale(vectorScale(Fg, -1), 1 / a.m);

  // if (r2) {
  //   console.error('close');
  //   throw a;
  // }

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
  var dis = Math.abs(vectorAdd(b.p, vectorNegate(a.p))[0]);
  // console.log('dis: ' + dis);

  if ((dis / scale) <= a.r + b.r) {
    b.p = vectorAdd(b.p, vectorNegate(((b.p, vectorNegate(a.p)), [-a.r, -a.r])));
    return true;
  }
}

function collideApply (a, b) {
  var distance = Math.sqrt(sqrtMagnitude(vectorAdd(a.p, vectorNegate(b.p))));
  var collision = vectorScale([1, 0], 1 / distance);

  var aci = vectorDot(a.v, collision);
  var bci = vectorDot(b.v, collision);

  // TODO: plug in the velocity formular here
  var acf = vectorScale(
    vectorAdd((vectorScale(a.v, a.m - b.m)), vectorScale(vectorScale(b.v, b.m), 2)),
    a.m + b.m);
  console.log(acf);
  var bcf = vectorScale(
    vectorAdd((vectorScale(b.v, b.m - a.m)), vectorScale(vectorScale(a.v, a.m), 2)),
    a.m + b.m);
  console.log(bcf);

  a.v = vectorAdd(a.v, vectorScale(vectorScale(collision, (vectorAdd(acf, [-aci, -aci]))), 1 / scale));
  // console.log(vectorScale(vectorScale(collision, (acf - aci)), scale));
  b.v = vectorAdd(b.v, vectorScale(vectorScale(collision, (vectorAdd(bcf, [-bci, -bci]))), 1 / scale));
  // console.log(vectorScale(vectorScale(collision, (bcf - bci)), scale));
  a.a = [0, 0];
  b.a = [0, 0];
}

// gameloop
var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

document.addEventListener('click', function (event) {
  var rect = canvas.getBoundingClientRect();
  var x = (((event.clientX - rect.left) - xPos * zoom) * scale) / zoom;
  var y = (((event.clientY - rect.top) - yPos * zoom) * scale) / zoom;
  // console.log('x: ' + x + ' y: ' + y);
  if (selectedBody.hasOwnProperty('r')) {
    // get distance from current mouse and direction and set velocity
    var dir = vectorAdd(selectedBody.p, vectorNegate([x, y]));
    console.dir(JSON.stringify(dir));
    // dir = vectorScale(dir, 1 / Math.sqrt(sqrtMagnitude(dir)));
    selectedBody.v = vectorScale(dir, -100 / scale);

    activeBodies.push(selectedBody);
    selectedBody = {};
  } else {
    // for (var i = 0; i < activeBodies.length; i++) {
    //   var dis = Math.abs(Math.sqrt(sqrtMagnitude(vectorAdd([((event.clientX - rect.left) + xPos) / zoom,
    //     ((event.clientY - rect.left) + yPos) / zoom], vectorNegate(activeBodies[i].p))))) % 1000;
    //   console.log('dis: ' + dis);
    //
    //   if (dis <= activeBodies[i].r * 60) {
    //     selectedBody = activeBodies[i];
    //     activeBodies.splice(i);
    //     return;
    //   }
    // }
    selectedBody = new Body([x, y], holdTime / 10 + 10, [0, 0], [0, 0], holdTime * 1E28);
    console.log(holdTime);
  }
});
this.canvas.addEventListener('mousedown', function (evt) {
  holdStart = Date.now();
});

this.canvas.addEventListener('mouseup', function (evt) {
  holdTime = Date.now() - holdStart;
  // now in holdTime you have time in milliseconds
});

document.addEventListener('keydown', function (event) {
  // event.preventDefault();

  if (event.code === 'ArrowRight') {
    xPos -= 10 / zoom;
  }
  if (event.code === 'ArrowLeft') {
    xPos += 10 / zoom;
  }
  if (event.code === 'ArrowDown') {
    yPos -= 10 / zoom;
  }
  if (event.code === 'ArrowUp') {
    yPos += 10 / zoom;
  }
  if (event.code === 'Equal') {
    zoom = zoom / 10 * 11;
  }
  if (event.code === 'Minus') {
    zoom = zoom / 10 * 9;
  }
  if (event.code === 'KeyX') {
    time = time / 10 * 11;
  }
  if (event.code === 'KeyZ') {
    time = time / 10 * 9;
  }
  if (event.code === 'KeyC') {
    activeBodies = [];
    selectedBody = {};
  }
  if (event.code === 'Space') {
    pause = !pause;
  }
  // canvas.width = canvas.width;
});

function init () {
  // activeBodies.push(new Body([400 * scale, 400 * scale], 10, [0, 0], [0, 0], 1E34));
  // activeBodies.push(new Body([500 * scale, 400 * scale]));
}

function gameloop () {
  window.requestAnimationFrame(gameloop);
  ctx.save();

  var now = Date.now();
  dt = (now - lastUpdate) * time;
  lastUpdate = now;

  if (dt > interval) {
    canvas.width = canvas.width;
    ctx.scale(zoom, zoom);
    ctx.translate(xPos, yPos);
    if (!pause) {
      for (var x = 0; x < activeBodies.length; x++) {
        for (var y = 0; y < activeBodies.length; y++) {
          if (x !== y) {
            // console.log('x: ' + x + ', y: ' + y);
            if (collide(activeBodies[x], activeBodies[y]) !== true) {
              gravity(activeBodies[x], activeBodies[y]);
            } else {
              // gravity(activeBodies[x], activeBodies[y]);
              // collideApply(activeBodies[x], activeBodies[y]);
              console.log('collision detected');
            }
          }
        }
      }

      for (x = 0; x < activeBodies.length; x++) {
        activeBodies[x].apply();
        activeBodies[x].render();
      }
    } else {
      for (x = 0; x < activeBodies.length; x++) {
        activeBodies[x].render();
      }
    }

    // tests if selected body is initialized with a body type if so render
    if (selectedBody.hasOwnProperty('r')) {
      selectedBody.render('#27305e');
    }
    ctx.fill();
  }

  ctx.restore();
}

init();
gameloop();
