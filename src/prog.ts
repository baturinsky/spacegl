import { initGeometry, putWorldnBuffers } from "./generator";
import * as render from "./render"
import { Vec2 } from "./g0/v";
import * as v3 from "./g0/v3";
import * as v from "./g0/v";
import * as kb from "./controls";
import * as game from "./game"
import * as snd from "./sound";
import { range, rangef } from "./g0/misc";

function main() {

  const viewSize: Vec2 = [1600, 900];

  let startTime = Date.now();

  let world = initGeometry();

  let [pMain, C] = render.init(viewSize);

  game.initControls();
  let state = game.init();

  let [bufs, elements] = putWorldnBuffers(world, pMain);

  console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);

  let t = 0;

  function update(dTime: number) {
    game.update(dTime);
    render.frame(state, [bufs, elements]);
    t++;
  }

  let started = false;
  C.onclick = e => {
    togglePlaying(true);
    if (!started) {
      let lastTime = Date.now();
      const loop = () => {
        if (playing())
          update(Date.now() - lastTime)
        lastTime = Date.now();
        requestAnimationFrame(loop)
      }
      loop();
    }
    started = true;
  }

  document.onkeydown = e => {
    switch (e.code) {
      case "Space":
        togglePlaying();
        break;
    }
  }

  function playing() {
    return document.pointerLockElement == C;
  }

  function togglePlaying(on?: boolean) {
    if (on == null)
      on = !playing();

    if (on)
      C.requestPointerLock();
    else
      document.exitPointerLock();
  }

  update(0);

}

function testSound() {
  document.body.innerHTML = "<button id=Play>Play</button><br/>" + document.body.innerHTML;

  document.getElementById("Play").onclick = () => {
    snd.init();
    snd.play2()
  }
}

main();
