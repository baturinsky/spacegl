import * as v3 from "./g0/v3";
import * as v from "./g0/v";

import { Vec3 } from "./g0/v3";
import { Vec2 } from "./g0/v";
import { X, Y } from "./g0/misc";
import { crashPixel } from "./render";

const rad = Math.PI / 180;
const acc = 300;
const heightToSpeed = 0;//0.3;
const friction = 0;//0.00003;
const orbSpeedBonus = 10;
const minimumVelocity = 10;
const accPerClick = 30;
const slowPerClick = 30;
const InitialRot = [90, 0] as v.Vec2;

let frame = 0;
let lastTime = 0;
let mouseDelta = [0, 0];
let fps = 60;
let state: State;
let tilt = 0;

export type State = {
  dir: Vec3;
  time: number;
  at: Vec3;
  vel: number;
  drot: Vec2;
  smoothDrot: Vec2;
  rot: Vec2;
};

export function init() {
  state = {
    dir: [1, 0, 0],
    at: [0, -300, 0],
    vel: 0.05,
    time: 0,
    drot: [0, 0],
    smoothDrot: [0, 0],
    rot: InitialRot,
  };
  return state;
}

export function update(dTime: number) {

  state.time++;

  let velDelta = ((keyPressed[0] ? 1 : 0) + (keyPressed[2] ? -1 : 0)) * dTime * 0.0003;

  state.vel += Math.max(velDelta, -state.vel);

  mouseDelta = mouseDelta.map(
    d => Math.sign(d) * Math.min(30, Math.abs(d) * dTime * 60)
  ) as v.Vec2;

  state.drot[X] = state.drot[X] - mouseDelta[X] * 0.1;
  state.drot[Y] = Math.max(
    -89.999,
    Math.min(89.999, state.drot[1] - mouseDelta[1] * 0.1)
  );

  let turn = Math.min(1, dTime * 0.01);

  state.smoothDrot = state.smoothDrot.map(
    (prevSmooth, i) => prevSmooth * (1 - turn) + state.drot[i] * turn
  ) as v.Vec2;

  state.rot = v.sum2(state.rot, state.smoothDrot, 0.006)
  state.rot[Y] = Math.max(-89, Math.min(state.rot[Y], 89));

  state.smoothDrot = v.scale(state.smoothDrot, 1 - turn * 0.2)

  let [yaw, pitch] = state.rot.map(v => v * rad);

  state.dir = v3.norm([
    Math.cos(pitch) * Math.cos(yaw),
    Math.cos(pitch) * Math.sin(yaw),
    Math.sin(pitch)
  ]);

  let right = [Math.sin(yaw), -Math.cos(yaw), 0] as Vec3;
  let left = [-Math.sin(yaw), Math.cos(yaw), 0] as Vec3;
  let back = [-Math.cos(yaw), -Math.sin(yaw), 0] as Vec3;

  tilt += mouseDelta[0];
  tilt *= (1 - 10. * dTime);

  mouseDelta = [0, 0];

  state.vel *= 1 - friction * dTime;

  let delta = v3.scale(state.dir, state.vel * dTime);
  state.at = v3.sum(state.at, delta);


  const checkCollisions = true;

  if (checkCollisions) {
    if (crashPixel[0][2]>10) {
      state.at = v3.sumvn(state.at, right, state.vel * 10)
      state.at = v3.sumvn(state.at, back, state.vel * 10)
      if (state.vel > -0.1)
        state.vel -= 0.005;
      //console.log("R");
    }
    if (crashPixel[1][2]>10) {
      state.at = v3.sumvn(state.at, left, state.vel * 10)
      state.at = v3.sumvn(state.at, back, state.vel * 10)
      if (state.vel > -0.1)
        state.vel -= 0.005;
      //console.log("L");
    }
    if (crashPixel[2][2]>10) {
      state.at = v3.sumvn(state.at, back, state.vel * 100)
      if (state.vel > -0.1)
        state.vel -= 0.03;
      //console.log("B");
    }
  }

}

export const keyPressed: boolean[] = [];

export function initControls() {
  ["keydown", "keyup", "mousedown", "mouseup", "mousemove"].forEach(t => document.addEventListener(t, (e: MouseEvent) => {
    switch (e.type) {
      case "mousemove":
        mouseDelta = v.sum(mouseDelta, [e.movementX, e.movementY])
        break;
      case "mousedown":
        keyPressed[e.button] = true;
        break;
      case "mouseup":
        keyPressed[e.button] = false;
        break;
    }
  }))
}
