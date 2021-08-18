//@ts-check  

import * as gc from "./g0/glconst";
import * as g from "./g0/gl"
import * as v3 from "./g0/v3"
import * as m4 from "./g0/m4"
import {gl} from "./g0/gl";
import shaders from "./shaders"
import { combine, pie, Shape, X, Y, Z } from "./g0/misc";

const width = 800, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

g.context(C);

//console.log(111, m4.transform(m4.translation([0.5,0.5,0]), [1,0,0]));

let pp:Shape[] = []

for(let i=0; i<10000;i++){
  pp.push(m4.transformShape(m4.translation([Math.random()*10-5,Math.random()*10-5,0]), pie(Math.random()*0.5,1 + Math.random()*5,10)));
}

let p = combine(pp);

console.log(p);

let vertBuf = g.databuffer();
let normBuf = g.databuffer();
let indexBuf = g.databuffer();

function createArrays(){
  return [new Float32Array(p.vert.flat()), new Float32Array(p.norm.flat()), new Uint32Array(p.face.flat())]
}

function setDatabuffers(){
  let arrays = createArrays();
  g.setDatabuffer(vertBuf, arrays[0]);  
  g.setDatabuffer(normBuf, arrays[1]);  
  g.setDatabuffer(indexBuf, arrays[2], gc.ELEMENT_ARRAY_BUFFER);
}

setDatabuffers();

let textures = [g.TEX_RGBA, g.TEX_RGBA, g.TEX_DEPTHS].map(
  (tex) => g.texture(width, height, tex)
);

let framebuffer = g.framebuffer(textures);

let t = 0;

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 0.5;
const zFar = 80;
const look = m4.lookAt([0,5,10],[0, 0, 0],[0,0,1]);

const perspective = m4.perspective(fov, aspect, zNear, zFar);
const camera = m4.multiply(perspective, m4.inverse(look));

let pWorld = g.compile(shaders.vCamera, shaders.fMain);
let pWorldUniform = g.uniforms(pWorld);

let pScreen = g.compile(shaders.vScreenQuad, shaders.fScreen);
let pScreenUniform = g.uniforms(pScreen);

function loop() {

  gl.useProgram(pWorld);
  
  pWorldUniform.camera(camera)
  g.attr(pWorld, "vert", vertBuf, 3);
  g.attr(pWorld, "norm", normBuf, 3);

  gl.bindFramebuffer(gc.FRAMEBUFFER, framebuffer);
  gl.drawBuffers([
    gc.COLOR_ATTACHMENT0,
    gc.COLOR_ATTACHMENT1
  ]);
  gl.clear(gc.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.drawElements(gc.TRIANGLES, p.face.length*3, gc.UNSIGNED_INT, 0);

  gl.useProgram(pScreen);
  g.bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(gc.FRAMEBUFFER, null);
  gl.drawArrays(gc.TRIANGLES, 0, 6)

  t++;
}

console.log("done")

window.onclick = loop;

loop();
