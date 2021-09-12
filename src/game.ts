import * as v3 from "./g0/v3";
import * as v from "./g0/v";
import * as snd from "./sound";

import { Vec3 } from "./g0/v3";
import { Vec2 } from "./g0/v";
import { rangef, RNG, X, Y } from "./g0/misc";
import { crashPixel, notify } from "./render";
import { Debris, MaxDebris } from "./generator";
import { saveToSlot } from "./prog";
import { debris } from "./generator";

const rad = Math.PI / 180,
  InitialRot = [90, 0] as v.Vec2;

let mouseDelta = [0, 0];
let gs: GameState = {} as any;

export const MaxTimeout = 10;

const Radius = 0, Acceleration = 1, Turning = 2, Timeout = 3, ComboStart = 4, Durability = 5;

export const UpgradeNames = [
  "Extend collection radius",
  "Accelerate and brake faster",
  "Turn faster",
  "Longer combo timer",
  "Bigger starting combo multiplier",
  "Less combo loss on collisions"
]

export type GameState = {
  dir: Vec3;
  time: number;
  at: Vec3;
  vel: number;
  drot: Vec2;
  smoothDrot: Vec2;
  rot: Vec2;

  consuming: number;
  consumingStage: number;

  debris: Debris[];
  liveDebris: Int32Array;
  debrisLeft: number;

  combo: number;
  timeout: number;
  timeoutSpeed: number;
  speedBonus: number;

  score: number;

  upgrades: number[];
  points: number;
  level: number;
};

const liveDebris = new Int32Array(32);

export function init() {
  Object.assign(gs, {
    dir: [1, 0, 0],
    at: [0, -300, 0],
    vel: 0.05,
    time: 0,
    drot: [0, 0],
    smoothDrot: [0, 0],
    rot: InitialRot,

    consuming: -1,
    consumingStage: 0,

    debris,
    liveDebris,
    debrisLeft: 0,

    combo: 0,
    timeout: 0,
    timeoutSpeed: 0,
    speedBonus: 0,

    score: 0,

    upgrades: [0, 0, 0, 0, 0, 0],

    points: 0,
    level: 0
  });

  for (let d of gs.debris) {
    let live = rng(2);
    d.live = live ? true : false;
  }

  updateLiveDebris();

  return gs;
}

let rng = RNG(1);

export function update(dTime: number) {

  gs.time += dTime;

  while (scoreForNextLevel() <= gs.score) {
    notify("LEVEL UP!", 2)
    gs.level++;
    gs.points++;
    for (let i = 0; i < 12; i++)
      setTimeout(() => snd.node(i), i * 100);
  }

  if (dTime > rng()) {
    let d = gs.debris[rng(gs.debris.length)];
    d.live = !d.live;
    updateLiveDebris();
  }

  if (gs.combo > 0)
    gs.timeout -= (1 + gs.timeoutSpeed) * dTime;

  if (gs.timeout <= 0 || gs.combo <= 0) {
    gs.timeout = 0;
    gs.timeoutSpeed = 0;
    gs.combo = 0;
  }

  let velDelta = ((keyPressed[0] ? 1 : 0) + (keyPressed[2] ? -1 : 0)) * dTime * (0.15 + gs.upgrades[Acceleration] * 0.1);

  gs.vel += Math.max(velDelta, -gs.vel);

  gs.speedBonus = Math.min(gs.speedBonus + dTime / 10, gs.vel);

  mouseDelta = mouseDelta.map(
    d => Math.sign(d) * Math.min(30, Math.abs(d) * dTime * 6e4)
  ) as v.Vec2;

  gs.drot[X] = gs.drot[X] - mouseDelta[X] * 0.1;
  gs.drot[Y] = Math.max(
    -89.999,
    Math.min(89.999, gs.drot[1] - mouseDelta[1] * 0.1)
  );

  let turn = Math.min(1, dTime * (7 + gs.upgrades[Turning] * 3));

  gs.smoothDrot = gs.smoothDrot.map(
    (prevSmooth, i) => prevSmooth * (1 - turn) + gs.drot[i] * turn
  ) as v.Vec2;

  gs.rot = v.sum2(gs.rot, gs.smoothDrot, 0.006)
  gs.rot[Y] = Math.max(-89, Math.min(gs.rot[Y], 89));

  gs.smoothDrot = v.scale(gs.smoothDrot, 1 - turn * 0.2)

  let [yaw, pitch] = gs.rot.map(v => v * rad);

  gs.dir = v3.norm([
    Math.cos(pitch) * Math.cos(yaw),
    Math.cos(pitch) * Math.sin(yaw),
    Math.sin(pitch)
  ]);

  mouseDelta = [0, 0];

  let delta = v3.scale(gs.dir, gs.vel * dTime * 1000);
  gs.at = v3.sum(gs.at, delta);

  gs.debris.forEach((d, i) => {
    let at = v3.sum(d.at, v3.scale(d.up, Math.sin(d.ind + gs.time * 0.1) * 20.));
    if (d.live && v3.dist(at, gs.at) < 30 + (gs.upgrades[Radius] ** 0.4) * 10) {
      consume(d);
    }
  });

  if (gs.consuming > -1) {
    gs.consumingStage = gs.consumingStage + dTime * 10;
    if (gs.consumingStage > 1) {
      gs.consuming = -1;
    }
  }

  const checkCollisions = true;

  if (checkCollisions) {
    for (let crashPoint in [0, 1, 2]) {
      let proximity = crashPixel[crashPoint][3];
      if (proximity > 10) {
        let raw = [...crashPixel[crashPoint].slice(0, 3)] as Vec3;
        let norm = v3.norm(v3.sumn(raw, -128));
        let crashAngle = -v3.mul(norm, gs.dir);
        let damage = crashAngle * gs.vel;
        console.log("DAMAGE", damage);
        damage -= gs.upgrades[Durability] * 0.05;
        if (damage > 0) {
          gs.combo -= damage;
          gs.timeout -= damage;
        }
        if (crashAngle > 0) {
          snd.node(rng(20) - 60, crashAngle * 10, crashAngle ** 2);
          gs.at = v3.sumvn(gs.at, norm, gs.vel * crashAngle * proximity / 2)
          gs.vel *= 1 - Math.min(1, crashAngle * 0.03);

        }
      }
    }
  }

}

function consume(d: Debris) {
  d.live = false;

  let gain = ~~(d.score * comboMultiplier() * speedMultiplier() * cleanCityMultiplier());

  notify(gain.toFixed())

  snd.node(rng(20) - 30 + gs.combo);
  gs.consuming = d.ind;
  gs.consumingStage = 0;

  gs.combo += 1;
  gs.timeoutSpeed += 0.1 / (1 + 0.3 * gs.upgrades[Timeout]);
  gs.timeout = MaxTimeout;

  //console.log("gain", d.score);

  gs.score += gain;

  updateLiveDebris();
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

function removeDebris(i: number) {
  gs.liveDebris[~~(i / 30)] = gs.liveDebris[~~(i / 30)] & ~(1 << i % 30);
}

function addDebris(i: number) {
  gs.liveDebris[~~(i / 30)] = gs.liveDebris[~~(i / 30)] | (1 << i % 30);
}


function updateLiveDebris() {
  gs.debrisLeft = 0;

  gs.liveDebris.fill(0);
  for (let d of gs.debris) {
    if (d.live) {
      gs.liveDebris[~~(d.ind / 30)] += 1 << d.ind % 30;
      gs.debrisLeft++;
    }
  }

  if (gs.time > 1)
    saveToSlot(0);
}


export function relativeTimeout() {
  return gs.timeout / MaxTimeout;
}

export function comboMultiplier() {
  return ~~(10 + ~~(gs.upgrades[ComboStart] * 3.334) + gs.combo) / 10;
}

export function cleanCityMultiplier() {
  return ~~(MaxDebris / gs.debrisLeft * 5) / 10;
}

export function speedMultiplier() {
  return 1 + 0.1 * ~~(gs.speedBonus ** 2 * 100);
}

export function save() {
  let save = { ...gs } as any;
  delete save.liveDebris;
  save.debris = save.debris.map((d: Debris) => d.live ? 1 : 0).join('');
  save.date = new Date().toLocaleString();
  return JSON.stringify(save);
}

export function load(s: string) {
  if (!s)
    return;
  let liveDebris = gs.liveDebris, debris = gs.debris;
  Object.assign(gs, JSON.parse(s));
  (gs.debris as any).split().forEach((v: string, i: number) => debris[i].live = v == '1')
  gs.liveDebris = liveDebris;
  gs.debris = debris;
  updateLiveDebris();
}

export function scoreForNextLevel() {
  return (gs.level + 1) * (gs.level + 2) * 500;
}