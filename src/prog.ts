import { initGeometry, putShapesInBuffers } from "./generator";
import * as render from "./render"
import { Vec2 } from "./g0/v";
import * as v3 from "./g0/v3";
import * as v from "./g0/v";
import * as kb from "./controls";
import * as game from "./game"
import * as snd from "./sound";
import { range, rangef } from "./g0/misc";
import { gl, putShapesInElementBuffers, setAttrDatabuffers } from "./g0/gl";

let noiseGain: GainNode, noiseVol = 1;

const attributes = { at: [3], norm: [3], cell: [3], type: [4], shape: [1], up: [3] };

function main() {

  const viewSize: Vec2 = [1200, 800];

  let startTime = Date.now();

  let [world, flyer] = initGeometry();

  let [C, O] = render.init(viewSize);

  game.initControls();
  let gs = game.init();

  let [bufs, elements] = putShapesInElementBuffers(world, attributes);
  let [bufsF, elementsF] = putShapesInElementBuffers(flyer, attributes);

  console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);

  let t = 0;

  function update(dTime: number) {
    game.update(dTime);
    render.frame(gs, [bufs, elements], [bufsF, elementsF], dTime);
    if (noiseGain) {
      noiseGain.gain.value = gs.vel * noiseVol * 0.7;
      if (dTime * gs.vel * 10 > Math.random()) {
        noiseVol = .5 + Math.random();
      }
      noiseVol = noiseVol * (1 - dTime) + dTime;
    }
    t++;
  }

  let started = false;

  C.onclick = e => {
    togglePlaying(true);
    if (!started) {
      snd.init();
      noiseGain = snd.playNoise();
      let lastTime = Date.now();
      const loop = () => {
        if (playing())
          update((Date.now() - lastTime) / 1000)
        lastTime = Date.now();
        requestAnimationFrame(loop);
      }
      loop();
    }
    started = true;
  }

  O.onclick = e => {
    let id = (e.target as HTMLElement).id;
    let [cmd, n] = id.split("_") as [string, number];
    switch (cmd) {
      case "up":
        if (gs.points > 0) {
          gs.upgrades[n]++;
          gs.points--;
        }
        break;
      case "down":
        if (gs.upgrades[n] > 0) {
          gs.upgrades[n]--;
          gs.points++;
        }
        break;
      case "save":
        saveToSlot(n);
        break;
      case "load":
        loadSlot(n);
        render.renderUI(null);
        update(0);
        setTimeout(() => togglePlaying(true), 10)
        break;
      case "new":
        game.init();
        render.renderUI(null);
        update(0);
        setTimeout(() => togglePlaying(true), 10)
        break;
    }
    render.renderUI(gs);
  }

  document.onkeydown = e => {
    switch (e.code) {
      case "Space":
        togglePlaying();
        break;
      case "KeyS":
        saveToSlot(0);
        break;
      case "KeyL":
        loadSlot(0);
        break;
    }
  }

  function playing() {
    return document.pointerLockElement == C;
  }

  function togglePlaying(on?: boolean) {
    if (on == null)
      on = !playing();

    if (on) {
      C.requestPointerLock();
      render.renderUI(null);
    } else {
      document.exitPointerLock();
      if (noiseGain)
        noiseGain.gain.value = 0;
      render.renderUI(gs);
    }
  }

  loadSlot(0);
  update(0);

  togglePlaying(false);
}


let settings = localStorage.warpStation13K || { slot: 0 };

function storeSettings() {
  localStorage.warpStation13K = settings;
}

function testSound() {
  document.body.innerHTML = "<button id=Play>Play</button><br/>" + document.body.innerHTML;

  document.getElementById("Play").onclick = () => {
    snd.init();
    snd.play2()
  }
}

export function saveToSlot(slot: number) {
  localStorage["warpStation13K-" + slot] = game.save();
}

export function loadSlot(slot: number) {
  game.load(localStorage["warpStation13K-" + slot]);
}


main();

//testSound();


