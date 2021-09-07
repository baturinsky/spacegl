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

function main() {

  const viewSize: Vec2 = [1200, 800];

  let startTime = Date.now();

  let [world, flyer] = initGeometry();

  let [pMain, C] = render.init(viewSize);

  game.initControls();
  let state = game.init();

  let conf = { at: [3], norm: [3], cell: [3], type: [4], shape: [1] };

  let [bufs, elements] = putShapesInElementBuffers(world, conf);
  let [bufsF, elementsF] = putShapesInElementBuffers(flyer, conf);

  //setAttrDatabuffers(bufs, pMain)

  /*let [bufs, elements] = putShapesInBuffers(world, pMain);

  let [b,a] = putShapesInElementBuffers(flyer, { at: [3], norm: [3], cell: [3], type: [4], shape: [1] });
  setAttrDatabuffers(b, pMain);

  putShapesInBuffers(flyer, pMain);*/

  //let [bufsF, elementsF] = putShapesInBuffers(flyer, pMain);

  /*gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);*/

  console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);

  let t = 0;

  function update(dTime: number) {
    game.update(dTime);
    render.frame(state, [bufs, elements], [bufsF, elementsF]);
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
        //requestAnimationFrame(()=>{new Promise(r=>r(null)).then(loop)})
        setTimeout(loop, 1000/60);
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
