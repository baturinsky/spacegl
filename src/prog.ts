import { initGeometry, putWorldnBuffers } from "./geometry";
import * as render from "./render"
import { Vec2 } from "./g0/vec";
import { Vec3 } from "./g0/vec3";
import * as kb from "./controls";
import * as game from "./game"

const viewSize: Vec2 = [1600, 900];

let startTime = Date.now();

let world = initGeometry();

let [pMain, C] = render.init(viewSize);

game.initControls();
let state = game.init();

let [bufs, elements] = putWorldnBuffers(world, pMain);

console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);

let t = 0;
let paused = false;

let msPerTic = 50;

function update() {
  //let camera = render.camera([0, -500 + t, 200], viewSize);
  let camera = render.camera(state.pos, state.dir, viewSize);
  game.update(msPerTic);
  render.frame(camera, [bufs, elements]);
  t++;
}

update();

let started = false;
window.onclick = e => {
  if (!started) {
    C.requestPointerLock();
    setInterval(update, msPerTic);
  }
  started = true;
}

//loop();




