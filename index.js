const canvas = document.getElementById("canvas");
const container = document.querySelector(".container");
const ctx = canvas.getContext("2d");
const cur_demo_display = document.getElementById("cur_demo");
const push = document.getElementById("push");
const friction = document.getElementById("friction");
const variance = document.getElementById("variance");

// TODO
function checkResize() {

}

let width, height;

width = canvas.width;
height = canvas.height;

window.onresize = function(evt) {
  width = canvas.width;
  height = canvas.height;
}

const timed_state = {
  time: 0,
  x: 0, y: 0, ix: 100, iy: 100,
  i: 0,
  name: "Timed",
  actions: [{speed: 2, direction: 0, time: 80}, {speed: 5, direction: -Math.PI / 2, time: 150}, {speed: 2, direction: Math.PI / 4, time: 200}],
  reset: function() {
    this.x = this.ix;
    this.y = this.ix;
    this.time = 0;
    this.i = 0;
  },
  get_target: function() {
    let tx = this.ix, ty = this.ix;
    for (const it of this.actions) {
      tx += it.speed * it.time * Math.cos(it.direction);
      ty -= it.speed * it.time * Math.sin(it.direction);
    }

    return {x: tx, y: ty};
  },
  update: function() {
    let frict = new Number(friction.value)
    let vary = new Number(variance.value)
    this.time++;

    if (this.i >= this.actions.length) return;

    if (this.time > this.actions[this.i].time) {
      this.time = 1;
      this.i++;
    }

    if (this.i >= this.actions.length) return;

    let a = this.actions[this.i];
    this.x += (this.vx = Math.cos(a.direction) * a.speed) * frict / 5 * (1 + (Math.random()) * 0.3 * vary / 5);
    this.y -= (this.vy = Math.sin(a.direction) * a.speed) * frict / 5 * (1 + (Math.random()) * 0.3 * vary / 5);

    if (this.push_ticks) {
      this.push_ticks--;
      this.x += this.push_x;
      this.y += this.push_y;
    }
  }
};

const pid_to_point_state = {
  name: "PID to Point",
  time: 0,
  x: 0, y: 0, ix: 100, iy: 100,
  i: 0, h: 0, vx: 0, vy: 0,
  error_sum: 0,
  last_error: 0,
  points: [{x: 300, y: 300}, {x: 600, y: 300}, {x: 200, y: 800}, {x: 800, y: 800}],
  reset: function() {
    this.x = this.ix;
    this.y = this.iy;
  },
  get_target: function() {
    return this.points.at(-1);
  },
  update: function() {
    let frict = new Number(friction.value)
    let vary = new Number(variance.value)
    const P = 0.5;
    const I = 0.01;
    const D = 0.01;

    if (this.i >= this.points.length) return;

    let err = Math.hypot(this.x - this.points[this.i].x, this.y - this.points[this.i].y);

    if (err < 10) this.i++;

    if (this.i >= this.points.length) return;

    let correction = err * P;
    correction += this.error_sum * I;
    correction += (err - this.last_error) * D;

    this.last_error = err;
    this.error_sum += err;

    correction /= 100;
    correction = Math.max(-1, Math.min(1, correction));

    correction *= 4;

    let dir = Math.atan2(-(this.points[this.i].y - this.y), this.points[this.i].x - this.x);
    this.h = dir;

    this.x += (this.vx = Math.cos(dir) * correction) * frict / 5 * (1 + (Math.random()) * 0.3 * vary / 5);
    this.y -= (this.vy = Math.sin(dir) * correction) * frict / 5 * (1 + (Math.random()) * 0.3 * vary / 5);

    if (this.push_ticks) {
      this.push_ticks--;
      this.x += this.push_x;
      this.y += this.push_y;
    }
  }
};

let DEMO_N = 0;
const DEMO_TIMED = DEMO_N++;
const DEMO_P2P = DEMO_N++;

let cur_demo = DEMO_TIMED;

const states = [timed_state, pid_to_point_state];

states[cur_demo].reset();

push.onclick = function() {
  states[cur_demo].push_x = (Math.random() * 2 - 1) * 3;
  states[cur_demo].push_y = (Math.random() * 2 - 1) * 3;
  states[cur_demo].push_ticks = 20;
}

cur_demo_display.innerHTML = `Current Demo: ${states[cur_demo].name}`;

function draw_circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function draw_x(x, y, r, color) {
  ctx.beginPath();
  ctx.moveTo(x - r, y - r);
  ctx.lineTo(x + r, y + r);
  ctx.moveTo(x - r, y + r);
  ctx.lineTo(x + r, y - r);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function draw_arrow(x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  let angle = Math.atan2(-(y1 - y2), x1 - x2);
  let angle1 = angle + Math.PI / 4;
  let angle2 = angle - Math.PI / 4;
  ctx.lineTo(x2 + 5 * Math.cos(angle1), y2 - 5 * Math.sin(angle1));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 + 5 * Math.cos(angle2), y2 - 5 * Math.sin(angle2));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function draw() {
  ctx.resetTransform();
  ctx.fillStyle = "#1e1e2f";
  ctx.fillRect(0, 0, width, height);

  ctx.setTransform(width / 1000, 0, 0, width / 1000, 0, 0);

  switch (cur_demo) {
    case DEMO_TIMED: {
      draw_arrow(timed_state.x, timed_state.y, timed_state.x + timed_state.vx * 15, timed_state.y - timed_state.vy * 15, "#ffd800");
      draw_circle(timed_state.x, timed_state.y, 10, "white");
      let target = timed_state.get_target();
      draw_x(target.x, target.y, 10, "#00ff00");
      timed_state.update();
      break;
    }
    case DEMO_P2P: {
      draw_arrow(pid_to_point_state.x, pid_to_point_state.y, pid_to_point_state.x + pid_to_point_state.vx * 15, pid_to_point_state.y - pid_to_point_state.vy * 15, "#ffd800");
      draw_circle(pid_to_point_state.x, pid_to_point_state.y, 10, "white");
      if (pid_to_point_state.i < pid_to_point_state.points.length) {
        draw_x(pid_to_point_state.points[pid_to_point_state.i].x, pid_to_point_state.points[pid_to_point_state.i].y, 5, "#ffd800");
      }
      let target = pid_to_point_state.get_target();
      draw_x(target.x, target.y, 10, "#00ff00");
      pid_to_point_state.update();
      break;
    }
  }

  requestAnimationFrame(draw);
}

draw();
