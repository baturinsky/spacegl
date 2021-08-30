import { initGeometry, putWorldnBuffers } from "./geometry";
import * as render from "./render"
import { Vec2 } from "./g0/v";
import * as v3 from "./g0/v3";
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

function update(dTime:number) {
  if(paused)
    return;
  game.update(dTime);
  render.frame(state, [bufs, elements]);
  t++;
}

update(0);

let started = false;
window.onclick = e => {
  togglePause(false);
  if (!started) {
    let lastTime = Date.now();
    const loop = () => {
      update(Date.now() - lastTime)
      lastTime = Date.now();
      requestAnimationFrame(loop)
    }
    loop();
  }
  console.log(e);
  started = true;
}

document.onkeydown = e => {
  switch(e.code){
    case "Space":
      togglePause();
      break;
  }
}

function togglePause(on?:boolean){
  paused = on==null?!paused:on;
  if(paused)
    document.exitPointerLock();
  else 
    C.requestPointerLock();
}