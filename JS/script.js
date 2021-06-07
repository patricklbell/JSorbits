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
var isGravity = true;
var isMerge = true;
var scale = 1000000;
var xPos = 0;
var yPos = 0;
var zoom = 1;
var trails = true;
var trailStrength = 0.1;
var randomColours = true;
var time = 10000;
var G = 6.67;
var pause = false;


var gui = new guify({
  title: "Gravity Simulator",
  align: 'right',
  theme: 'dark',
  // barMode: 'none',
});

gui.Register([
  { 
    type: 'button', label: 'Reset',
    action: () => {
      init();
    },
  },
  { 
      type: 'range', label: 'FPS:', 
      min: 10, max: 60, step: 1,
      object: this,
      property: 'fps',
      onChange: (data) => {
        fps = data;
        var interval = 1000 / fps;
      },
  },
  { 
    type: 'range', label: 'Time Step:', 
    min: 100, max: 50000,
    object: this,
    property: 'time',
    onChange: (data) => {
      time = data;
    },
  },
  { 
      type: 'button', label: 'Clear',
      action: () => {
        activeBodies = [];
        selectedBody = {};
      },
  },
  { 
      type: 'checkbox', label: 'Gravity',
      object: this,
      property: 'isGravity',
      onChange: (data) => {
        isGravity = data;
      },
  },
  { 
    type: 'checkbox', label: 'Merge',
    object: this,
    property: 'isMerge',
    onChange: (data) => {
      isMerge = data;
    },
},
  { 
    type: 'checkbox', label: 'Trails',
    object: this,
    property: 'trails',
    onChange: (data) => {
      trails = data;
    },
  },
  { 
    type: 'range', label: 'Trail Strength:', 
    object: this,
    property: 'trailStrength',
    min: 0.01, max: 0.2, scale: "log",
    onChange: (data) => {
      trailStrength = data;
    },
  },
  { 
    type: 'checkbox', label: 'Colours',
    object: this,
    property: 'randomColours',
    onChange: (data) => {
      randomColours = data;
    },
  },
  { 
    type: 'range', label: 'Gravitational Const:', 
    object: this,
    property: 'G',
    min: 0.001, max: 100, scale: "log",
    onChange: (data) => {
      G = data;
    },
  },
]);

class Body {
  constructor (position, radius, velocity, acceleration, mass, colour) {
    this.p = position || [0, 0];
    this.r = radius || 10;
    this.v = velocity || [0, 0];
    this.a = acceleration || [0, 0];
    this.m = mass || 1E29;
    this.colour = colour || "#000000";
    // this.lastP = [];
    // for (let i = 0; i < 50; i++) {
    //   this.lastP.unshift([this.p[0] / scale, this.p[1] / scale]);
    // }
  }

  apply () {
    this.v[0] += this.a[0] * dt;
    this.v[1] += this.a[1] * dt;
    this.p[0] += this.v[0] * dt;
    this.p[1] += this.v[1] * dt;
    // this.lastP.pop();
    // this.lastP.unshift([this.p[0] / scale, this.p[1] / scale]);
  }
  
  
  render (colour) {
    // ctx.globalCompositeOperation = "destination-over";
    // ctx.strokeStyle = "#FF0000";
    // ctx.beginPath();
    // ctx.lineWidth = this.r;
    // for (let i = 1; i < this.lastP.length; i++) {
    //   ctx.moveTo(this.lastP[i-1][0], this.lastP[i-1][1]);
    //   ctx.lineTo(this.lastP[i][0], this.lastP[i][1]);
    //   ctx.stroke(); 
    //   ctx.lineWidth = this.r * (1-(i / this.lastP.length));
    // }
    // ctx.globalCompositeOperation = "source-over";

    if(randomColours){
      colour = colour || this.colour;
    } else {
      colour = colour || "#000000";
    }
    ctx.beginPath();
    ctx.arc(this.p[0] / scale, this.p[1] / scale, this.r / scale, 0, 2 * Math.PI);
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

function sqrMagnitude (V) {
  return Math.pow(V[0], 2) + Math.pow(V[1], 2);
}

function vectorDot (V1, V2) {
  return V1[0] * V2[0] + V1[1] * V2[1];
}

function vectorProduct (V1, V2) {
  return [V1[0] * V2[0], V1[1] * V2[1]];
}

function vectorNormalise (V1) {
  let w = Math.sqrt(sqrMagnitude(V1));
  if(w == 0){
    return [V1[0] / 1, V1[1] / 1];  
  }
  return [V1[0] / w, V1[1] / w];
}

// takes two bodies and calculates gravity's effect
function gravity (a, b) {
  var r2 = sqrMagnitude(vectorAdd(a.p, vectorNegate(b.p)));
  if (r2 === 0) {
    r2 = 1E-10;
    console.warn('uh oh!');
  }

  var mFg = (G*1E-11 * a.m * b.m) / r2;

  var dir = vectorAdd(b.p, vectorNegate(a.p));
  dir = vectorScale(dir, 1 / Math.sqrt(sqrMagnitude(dir)));

  var Fg = vectorScale(dir, mFg);

  // Fnet = ma
  a.a = vectorAdd(a.a, vectorScale(Fg, 1 / a.m));
  b.a = vectorAdd(b.a, vectorScale(vectorScale(Fg, -1), 1 / a.m));

  // if (r2) {
  //   console.error('close');
  //   throw a;
  // }

  // because dt is not infinitesimal
  // by the time two bodies get very close their velocity is enormous
  // but as they pass over the acceleration in the opposite direction should counteract that right?
  // no. Because when the next call to gravity is made their position has changed
  // so do a pre and post call

  return PEcalc(a, b);
}

function PEcalc (a, b) {
  // calculates the gravitational potential energy between the objects
  // then set the velocity so that kinetic energy is less or = to the gravitational PE
  let dis = Math.abs(Math.sqrt(sqrMagnitude(vectorAdd(b.p, vectorNegate(a.p)))));
  
  return -G*1E-11*( a.m * b.m / dis);
}

// takes two bodies and tests collision
function collide (a, b) {
  // find distance between bodies
  var dis = Math.abs(Math.sqrt(sqrMagnitude(vectorAdd(b.p, vectorNegate(a.p)))));

  if (dis <= a.r + b.r) {
    return true;
  }
  return false;
}

function collideApply (a, b) {
  let distance = Math.sqrt(sqrMagnitude(vectorAdd(a.p, vectorNegate(b.p))));

  // var collision = vectorScale([1, 0], 1 / distance);

  // var aci = vectorDot(a.v, collision);
  // var bci = vectorDot(b.v, collision);

  // // TODO: plug in the velocity formular here
  // var acf = vectorScale(
  //   vectorAdd((vectorScale(a.v, a.m - b.m)), vectorScale(vectorScale(b.v, b.m), 2)),
  //   a.m + b.m);
  // // console.log(acf);
  // var bcf = vectorScale(
  //   vectorAdd((vectorScale(b.v, b.m - a.m)), vectorScale(vectorScale(a.v, a.m), 2)),
  //   a.m + b.m);
  // // console.log(bcf);

  // a.v = vectorAdd(a.v, vectorScale(vectorScale(collision, (vectorAdd(acf, [-aci, -aci]))), 1 / scale));
  // // console.log(vectorScale(vectorScale(collision, (acf - aci)), scale));
  // b.v = vectorAdd(b.v, vectorScale(vectorScale(collision, (vectorAdd(bcf, [-bci, -bci]))), 1 / scale));
  // // console.log(vectorScale(vectorScale(collision, (bcf - bci)), scale));

  // http://www.euclideanspace.com/physics/dynamics/collision/twod/index.htm#code
  let n = vectorNormalise(vectorAdd(a.p, vectorNegate(b.p)));
  a.p = vectorAdd(b.p, vectorScale(n, a.r+b.r))
  a.v = vectorAdd(a.v, vectorScale(vectorScale(n, vectorDot(vectorAdd(a.v, vectorNegate(b.v)), n)), -( (a.m*b.m) / (a.m + b.m)) / a.m));
  n = vectorNormalise(vectorAdd(b.p, vectorNegate(a.p)));
  b.v = vectorAdd(b.v, vectorScale(vectorScale(n, vectorDot(vectorAdd(b.v, vectorNegate(a.v)), n)), -( (a.m*b.m) / (a.m + b.m)) / b.m));




  a.a = [0, 0];
  b.a = [0, 0];
}

// gameloop
var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

window.addEventListener('resize', function (event) {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  ctx.scale(zoom, zoom);
  ctx.translate(xPos, yPos);
  ctx.save();
});

this.canvas.addEventListener('click', function (event) {
  var rect = canvas.getBoundingClientRect();
  var x = (((event.clientX - rect.left) - xPos * zoom) * scale) / zoom;
  var y = (((event.clientY - rect.top) - yPos * zoom) * scale) / zoom;
  // console.log('x: ' + x + ' y: ' + y);
  if (selectedBody.hasOwnProperty('r')) {
    // get distance from current mouse and direction and set velocity
    var dir = vectorAdd(selectedBody.p, vectorNegate([x, y]));
    
    // dir = vectorScale(dir, 1 / Math.sqrt(sqrMagnitude(dir)));
    selectedBody.v = vectorScale(dir, -0.1 / scale);

    activeBodies.push(selectedBody);
    selectedBody = {};
  } else {
    // for (var i = 0; i < activeBodies.length; i++) {
    //   var dis = Math.abs(Math.sqrt(sqrMagnitude(vectorAdd([((event.clientX - rect.left) + xPos) / zoom,
    //     ((event.clientY - rect.left) + yPos) / zoom], vectorNegate(activeBodies[i].p))))) % 1000;
    //   console.log('dis: ' + dis);
    //
    //   if (dis <= activeBodies[i].r * 60) {
    //     selectedBody = activeBodies[i];
    //     activeBodies.splice(i);
    //     return;
    //   }
    // }
    selectedBody = new Body([x, y], holdTime * 100000, [0, 0], [0, 0], Math.pow(holdTime*10000000 + 10000000, 2), '#'+Math.floor(Math.random()*8388607 + 8388607).toString(16));
    console.log([x, y], holdTime *100000, [0, 0], [0, 0], Math.pow(holdTime*10000000 + 10000000, 2), '#'+Math.floor(Math.random()*8388607 + 8388607).toString(16));
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
  else if (event.code === 'ArrowLeft') {
    xPos += 10 / zoom;
  }
  else if (event.code === 'ArrowDown') {
    yPos -= 10 / zoom;
  }
  else if (event.code === 'ArrowUp') {
    yPos += 10 / zoom;
  }
  else if (event.code === 'Equal') {
    zoom = zoom / 10 * 11;
    xPos -= ctx.canvas.width/20 / zoom;
    yPos -= ctx.canvas.height/20 / zoom;
  }
  else if (event.code === 'Minus') {
    zoom = zoom / 10 * 9;
    xPos += ctx.canvas.width/20 / zoom;
    yPos += ctx.canvas.height/20 / zoom;
  }
  else if (event.code === 'KeyC') {
    activeBodies = [];
    selectedBody = {};
  }
  else if (event.code === 'Space') {
    pause = !pause;
    return;
  }
  else if (event.code === 'Escape') {
    selectedBody = {};
    return;
  }
  else {
    return;
  }
  canvas.width = canvas.width;
  ctx.scale(zoom, zoom);
  ctx.translate(xPos, yPos);
  ctx.save();
});

document.addEventListener("blur", function(event) {
  pause = true;
});

function init () {
  activeBodies = [];
  selectedBody = {};
  fps = 30;
  interval = 1000 / fps;
  isGravity = true;
  xPos = 0;
  yPos = 0;
  zoom = 1;
  trails = true;
  trailStrength = 0.1;
  time = 10000;
  G = 6.67;

  canvas.width = canvas.width;
  ctx.scale(zoom, zoom);
  ctx.translate(xPos, yPos);

  // activeBodies.push(new Body([600000000, 300000000], 200000000, [0, 0], [0, 0], 1E50, "#FF0000"));

  gameloop();
}

function gameloop() {
  window.requestAnimationFrame(gameloop);
  ctx.restore();

  var now = Date.now();
  dt = (now - lastUpdate) * time;
  lastUpdate = now;

  if (dt > interval) {
    if(trails){
      ctx.fillStyle = "rgba(250,250,250,".concat(trailStrength.toString()).concat(")");
    } else {
      ctx.fillStyle = "rgba(250,250,250,1)";
    }
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillRect(-xPos, -yPos, canvas.width / zoom, canvas.height / zoom);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255,255,255,1)";

    // tests if selected body is initialized with a body type if so render
    if (selectedBody.hasOwnProperty('r')) {
      selectedBody.render('#27305e');
    }

    if (!pause) {
      let U = 0, KE = 0;

      for (var x = 0; x < activeBodies.length; x++) {

        for (var y = x+1; y < activeBodies.length; y++) {
          if(isGravity && !collide(activeBodies[x], activeBodies[y])){
            // Figure out total gravitational potential energy
            U += gravity(activeBodies[x], activeBodies[y]);
          }
        }
        KE += 0.5*activeBodies[x].m*sqrMagnitude(activeBodies[x].v);
        
        
        activeBodies[x].apply();
        activeBodies[x].a = [0, 0];
        for (var y = x+1; y < activeBodies.length; y++) {
          if (collide(activeBodies[x], activeBodies[y]) || collide(activeBodies[y], activeBodies[x])) {
            if(isMerge){
              let tmpBody = new Body(
                vectorScale(vectorAdd(activeBodies[x].p, activeBodies[y].p), 1/2), 
                Math.sqrt(activeBodies[x].r*activeBodies[x].r + activeBodies[y].r*activeBodies[y].r),
                vectorScale(vectorAdd(vectorScale(activeBodies[x].v, activeBodies[x].m), vectorScale(activeBodies[y].v, activeBodies[x].m)), 1/(2*(activeBodies[x].m + activeBodies[y].m))), 
                [0, 0],
                activeBodies[x].m + activeBodies[y].m,
                '#'+Math.floor(Math.random()*8388607 + 8388607).toString(16),
              );
              activeBodies.splice(y, 1);
              activeBodies[x] = tmpBody;
              y--;

            } else {
              collideApply(activeBodies[x], activeBodies[y]);
            }
          }
        }
        activeBodies[x].render();
      }

      if (KE + U >= 0){
        // newV = Math.sqrt(-U / (0.5*activeBodies[x].m));
        // console.log("EXTRA ENERGY - KE: ", KE, "U: ", U);
        
        // activeBodies[x].v = vectorScale(vectorNormalise(activeBodies[x].v), newV);
      }
      

    } else {
      for (x = 0; x < activeBodies.length; x++) {
        activeBodies[x].render();
      }

      ctx.fillStyle = "#000000"
      let width = ctx.canvas.width/zoom / 90;
      let height = width *4;
      ctx.fillRect(-xPos + 0.5*width, -yPos + 0.5*width, width, height)
      ctx.fillRect(-xPos + 2*width, -yPos + 0.5*width, width, height)
    }
  }
}

init();