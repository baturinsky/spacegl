//@ts-check  

import { COLOR_ATTACHMENT0, COLOR_ATTACHMENT1, DEPTH_BUFFER_BIT, ELEMENT_ARRAY_BUFFER, FRAGMENT_SHADER, FRAMEBUFFER, TRIANGLES, UNSIGNED_SHORT, VERTEX_SHADER } from "./glconsts";
import { gl, glFramebuffer, glCompile, gl2Shader, glUniforms, glBindTextures, glTexture, glContext, glDrawQuad, TEX_RGBA, TEX_DEPTHS, glDatabuffer, glSetDatabuffer, glAttr } from "./gllib"
import shaders from "./shaders"
import { arr, mInverse, mLook, mMul, mPerspective, mSet, mvMul } from "./math3d";

console.log("mset", mSet([1, 2, 3], { 1: 5 }));

const width = 800, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

glContext(C);

let vertBuf = glDatabuffer();
glSetDatabuffer(vertBuf, new Float32Array([-1,-1,0, 1,-1,0, -1,1,0, 1,1,0]));

let indexBuf = glDatabuffer();
glSetDatabuffer(indexBuf, new Uint16Array([0,1,2, 2,1,3]), ELEMENT_ARRAY_BUFFER);

const vFullScreenQuad = gl2Shader(VERTEX_SHADER, shaders.vscreenQuad);

let textures = [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map(
  (tex) => glTexture(width, height, tex)
);

let framebuffer = glFramebuffer(textures);

let t = 0;

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 0.5;
const zFar = 800;

const projection = mPerspective(fov, aspect, zNear, zFar);
const camera = mLook([0, 0, 1]);
const view = mInverse(camera);
const viewProjection = mMul(projection, view);

let pm = glCompile(gl2Shader(VERTEX_SHADER, shaders.vasIs), gl2Shader(FRAGMENT_SHADER, `${shaders.fmain}`));
let pmUniform = glUniforms(pm);

let ps = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders.fscreen));
let psUniform = glUniforms(ps);

function loop() {

  gl.useProgram(pm);
  
  glAttr(pm, "position", vertBuf, 3);
  
  gl.bindFramebuffer(FRAMEBUFFER, framebuffer);
  gl.drawBuffers([
    COLOR_ATTACHMENT0,
    COLOR_ATTACHMENT1
  ]);
  gl.clear(DEPTH_BUFFER_BIT);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.drawElements(TRIANGLES, 6, UNSIGNED_SHORT, 0);
  //glDrawQuad();

  gl.useProgram(ps);
  glBindTextures(textures, [psUniform.T0, psUniform.T1, psUniform.Depth]);
  gl.bindFramebuffer(FRAMEBUFFER, null);
  glDrawQuad();

  t++;
}

window.onclick = loop;

loop();
