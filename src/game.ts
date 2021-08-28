import { Vec3 } from "./g0/vec3";
import * as v3 from "./g0/vec3";
import * as v from "./g0/vec";

const rad = Math.PI / 180;
const acc = 300;
const heightToSpeed = 0;//0.3;
const friction = 0;//0.00003;
const orbSpeedBonus = 10;
const minimumVelocity = 10;
const accPerClick = 30;
const slowPerClick = 30;

let frame = 0;
let lastTime = 0;
let mouseDelta = [0, 0];
let fps = 60;
let state: State;
let tilt = 0;

type State = {
  dir: Vec3;
  time: number;
  pos: Vec3;
  vel: number;
  rot: [number, number];
  smoothRot: [number, number];
};

export function init() {
  state = {
    dir: [1, 0, 0],
    pos: [0, 0, 300],
    vel: 0.05,
    time: 0,
    rot: [0, 0],
    smoothRot: [0, 0]
  };
  return state;
}

export function update(dTime:number){
  mouseDelta = mouseDelta.map(
    d => Math.sign(d) * Math.min(30, Math.abs(d) * dTime * 60)
  ) as v.Vec2;

  state.rot[0] = state.rot[0] - mouseDelta[0] * 0.1;
  state.rot[1] = Math.max(
    -89.999,
    Math.min(89.999, state.rot[1] - mouseDelta[1] * 0.1)
  );

  let turn = Math.min(1, dTime * 30);

  state.smoothRot = state.smoothRot.map(
    (prevSmooth, i) => prevSmooth * (1 - turn) + state.rot[i] * turn
  ) as v.Vec2;

  let [yaw, pitch] = state.smoothRot.map(v => v * rad);

  state.dir = v3.norm([
    Math.cos(pitch) * Math.cos(yaw),
    Math.cos(pitch) * Math.sin(yaw),
    Math.sin(pitch)
  ]);

  tilt += mouseDelta[0];
  tilt *= (1 - 10. * dTime);

  mouseDelta = [0, 0];  

  //debugger;
  state.vel *= 1 - friction * dTime;

  /*if (state.vel <= minimumVelocity) {
    let drop = minimumVelocity - state.vel / 100;
    state.pos[2] -= drop * heightToSpeed;
    state.vel += drop;
  }*/

  let delta = v3.scale(state.dir, state.vel * dTime);
  state.vel -= delta[2] * heightToSpeed;
  state.pos = v3.sum(state.pos, delta);

  console.log(state.pos);
}

export function initControls(){
  ["keydown", "keyup", "mousedown", "mouseup", "mousemove"].forEach(t => document.addEventListener(t, (e:MouseEvent) => {
    switch(e.type){
      case "mousemove":
        mouseDelta = v.sum(mouseDelta, [e.movementX, e.movementY])
        break;
    }
  }))  
}
