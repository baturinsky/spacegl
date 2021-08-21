//@ts-check  

import * as gc from "./g0/glconst";
import { gl } from "./g0/gl";
import * as g0 from "./g0/gl"
import * as v from "./g0/v3"
import * as m from "./g0/m4"
import shaders from "./shaders"
import { calculateNormals, combine, ETC, FACE, flat, generateCurve, GEOCHANNELS, mesh, NORM, pie, pie2, pie3, revolutionShader, Shape, shapesToBuffers, VERT, X, Y, Z } from "./g0/misc";

const width = 1600, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

g0.context(C);

let startTime = Date.now();

let pp: Shape[] = []

function generate() {

  for (let i = 0; i < 10000; i++) {
    let curve = generateCurve();
    let sectors = ~~(Math.random() * 10) + 3;
    pp.push(mesh(sectors, curve.length-1, revolutionShader(curve,sectors)));
    //pp.push(pie3(Math.random() + 0.3, 1 + Math.random() ** 7 * 5, ~~(Math.random() * 10) + 3));
  }
}

function transform() {
  pp = pp.map(p => {
    let mat = m.multiply(
      m.translation([Math.random() * 200 - 100, Math.random() * 100, 0]),
      m.axisRotation([0, 0, 1], Math.random() * 6)
    );
    calculateNormals(p);
    return m.transformShape(mat, p);
  })
}

function setDatabuffers() {
  g0.setDatabuffer(bufs[FACE], arrays[FACE], gc.ELEMENT_ARRAY_BUFFER)
  bufs.forEach((buf, channel) => {
    if (channel != FACE)
      g0.setDatabuffer(buf, arrays[channel]);;
  })
}


generate();
transform();

let arrays = shapesToBuffers(pp);
let bufs = GEOCHANNELS.map(i => g0.databuffer());

setDatabuffers();

console.log(`${Date.now() - startTime} ms ${arrays[1].length / 3} faces`);

let textures = [g0.TEX_RGBA, g0.TEX_RGBA, g0.TEX_DEPTHS].map(
  (tex) => g0.texture(width, height, tex)
);

let framebuffer = g0.framebuffer(textures);

let t = 0;

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 2;
const zFar = 200;
const look = m.lookAt([0, -20, 20], [0, 30, 0], [0, 0, 1]);

const perspective = m.perspective(fov, aspect, zNear, zFar);
const camera = m.multiply(perspective, m.inverse(look));

let pWorld = g0.compile(shaders.vMain, shaders.fMain);
let pWorldUniform = g0.uniforms(pWorld);

let pScreen = g0.compile(shaders.vScreenQuad, shaders.fScreen);
let pScreenUniform = g0.uniforms(pScreen);

function loop() {

  startTime = Date.now();

  gl.useProgram(pWorld);

  pWorldUniform.camera(camera)
  g0.attr(pWorld, "vert", bufs[VERT], 3);
  g0.attr(pWorld, "norm", bufs[NORM], 3);
  g0.attr(pWorld, "etc", bufs[ETC], 4);

  gl.bindFramebuffer(gc.FRAMEBUFFER, framebuffer);
  gl.drawBuffers([
    gc.COLOR_ATTACHMENT0,
    gc.COLOR_ATTACHMENT1
  ]);
  gl.clear(gc.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs[FACE]);
  gl.drawElements(gc.TRIANGLES, arrays[FACE].length, gc.UNSIGNED_INT, 0);

  gl.useProgram(pScreen);
  g0.bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(gc.FRAMEBUFFER, null);
  gl.drawArrays(gc.TRIANGLES, 0, 6)

  t++;

  gl.flush()

  console.log(`Rendered in ${Date.now() - startTime} ms`);
}

window.onclick = loop;

loop();
