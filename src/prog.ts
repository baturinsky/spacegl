//@ts-check  

import * as gc from "./g0/glconst";
import { gl } from "./g0/gl";
import * as g0 from "./g0/gl"
import * as v from "./g0/v3"
import * as m from "./g0/m4"
import shaders from "./shaders"
import { calculateNormals, combine, FACE, flat, NORM, pie, Shape, shapesToBuffers, VERT, X, Y, Z } from "./g0/misc";

const width = 1600, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

g0.context(C);

//console.log(111, m4.transform(m4.translation([0.5,0.5,0]), [1,0,0]));

let startTime = Date.now();

let pp: Shape[] = []

function generate() {

  for (let i = 0; i < 10000; i++) {
    let mat = m.multiply(      
      m.translation([Math.random() * 200 - 100, Math.random() * 100, 0]), 
      m.axisRotation([0, 0, 1], Math.random() * 6)
    );
    let p = pie(Math.random() + 0.3, 1 + Math.random() ** 7 * 5, ~~(Math.random() * 10) + 3);
    calculateNormals(p);
    //console.log(m);
    //let m = m4.translation([Math.random() * 200 - 100, Math.random() * 100, 0]);
    pp.push(m.transformShape(mat, p));
  }
}

generate();

let arrays = shapesToBuffers(pp);

let vertBuf = g0.databuffer();
let normBuf = g0.databuffer();
let indexBuf = g0.databuffer();
let etcBuf = g0.databuffer();

function setDatabuffers() {
  g0.setDatabuffer(vertBuf, arrays[0]);
  g0.setDatabuffer(indexBuf, arrays[1], gc.ELEMENT_ARRAY_BUFFER);
  g0.setDatabuffer(normBuf, arrays[2]);
  g0.setDatabuffer(etcBuf, arrays[3]);
}

//console.log(arrays);

setDatabuffers();

console.log(`${Date.now()-startTime} ms ${arrays[1].length/3} faces`);

let textures = [g0.TEX_RGBA, g0.TEX_RGBA, g0.TEX_DEPTHS].map(
  (tex) => g0.texture(width, height, tex)
);

let framebuffer = g0.framebuffer(textures);

let t = 0;

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 2;
const zFar = 200;
const look = m.lookAt([0, -10, 20], [0, 30, 0], [0, 0, 1]);

const perspective = m.perspective(fov, aspect, zNear, zFar);
const camera = m.multiply(perspective, m.inverse(look));

let pWorld = g0.compile(shaders.vMain, shaders.fMain);
let pWorldUniform = g0.uniforms(pWorld);

let pScreen = g0.compile(shaders.vScreenQuad, shaders.fScreen);
let pScreenUniform = g0.uniforms(pScreen);

function loop() {

  //gl.enable(gl.CULL_FACE);
  //gl.cullFace(gc.BACK);

  gl.useProgram(pWorld);

  pWorldUniform.camera(camera)
  g0.attr(pWorld, "vert", vertBuf, 3);
  g0.attr(pWorld, "norm", normBuf, 3);
  g0.attr(pWorld, "etc", etcBuf, 4);

  gl.bindFramebuffer(gc.FRAMEBUFFER, framebuffer);
  gl.drawBuffers([
    gc.COLOR_ATTACHMENT0,
    gc.COLOR_ATTACHMENT1
  ]);
  gl.clear(gc.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.drawElements(gc.TRIANGLES, arrays[FACE].length, gc.UNSIGNED_INT, 0);

  //gl.disable(gl.CULL_FACE);

  gl.useProgram(pScreen);
  g0.bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(gc.FRAMEBUFFER, null);
  gl.drawArrays(gc.TRIANGLES, 0, 6)

  t++;
}

console.log("done")

window.onclick = loop;

loop();
