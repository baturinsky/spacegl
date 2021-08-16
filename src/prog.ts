//@ts-check  

import { COLOR_ATTACHMENT0, COLOR_ATTACHMENT1, DEPTH_BUFFER_BIT, ELEMENT_ARRAY_BUFFER, FRAGMENT_SHADER, FRAMEBUFFER, TRIANGLES, UNSIGNED_INT, UNSIGNED_SHORT, VERTEX_SHADER } from "./glconsts";
import { gl, glFramebuffer, glCompile, gl2Shader, glUniforms, glBindTextures, glTexture, glContext, glDrawQuad, TEX_RGBA, TEX_DEPTHS, glDatabuffer, glSetDatabuffer, glAttr } from "./gllib"
import shaders from "./shaders"
import { arr, mI, mInverse, mLookAt, mLookTo, mMul, mnMul, mPerspective, mSet, mvMul } from "./math3d";
import * as m4 from "./twgl/m4"

console.log("mset", mSet([1, 2, 3], { 1: 5 }));

const width = 800, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

glContext(C);

let vertBuf = glDatabuffer();
glSetDatabuffer(vertBuf, new Float32Array([
  -1, -1, 1, 
  1, -1, 1, 
  -1, 1, 1, 
  1, 1, 1]));

let indexBuf = glDatabuffer();
glSetDatabuffer(indexBuf, new Uint32Array([0, 1, 2, 2, 1, 3]), ELEMENT_ARRAY_BUFFER);

const vFullScreenQuad = gl2Shader(VERTEX_SHADER, shaders.vscreenQuad);

let textures = [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map(
  (tex) => glTexture(width, height, tex)
);

let framebuffer = glFramebuffer(textures);

let t = 0;

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 0.5;
const zFar = 80;

const perspective = mPerspective(fov, aspect, zNear, zFar);
const look = mLookAt([0,10,-10],[0, 0, 0],[0,1,0]);
const camera = mMul(perspective, mInverse(look));

let pWorld = glCompile(gl2Shader(VERTEX_SHADER, shaders.vCamera), gl2Shader(FRAGMENT_SHADER, `${shaders.fmain}`));
let pWorldUniform = glUniforms(pWorld);

let pScreen = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders.fscreen));
let pScreenUniform = glUniforms(pScreen);

console.log({perspective, look, camera});

/*const perspective2 = m4.perspective(fov, aspect, zNear, zFar);
const look2 = m4.lookAt([0,10,-10],[0, 0, 0],[0,1,0]);
const camera2 = m4.multiply(perspective2, mInverse(look2));

console.log({perspective2, look2, camera2});*/

console.log("zero", mvMul(camera, [0,0,0,1]));
console.log("one", mvMul(camera, [-1,-1,1,10]));

let ii = [
  1,0,0,0,
  0,1,0,0,
  0,0,1,0,
  1,10,100,1
];


console.log("zero", mvMul(ii, [0,0,0,1]));
console.log("one", mvMul(ii, [1,1,1,1]));

console.log(m4.transformPoint(ii, [1,1,1,1]));


function loop() {

  gl.useProgram(pWorld);
  
  //pWorldUniform.camera(camera)
  pWorldUniform.camera(camera)
  glAttr(pWorld, "position", vertBuf, 3);

  gl.bindFramebuffer(FRAMEBUFFER, framebuffer);
  gl.drawBuffers([
    COLOR_ATTACHMENT0,
    COLOR_ATTACHMENT1
  ]);
  gl.clear(DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.drawElements(TRIANGLES, 6, UNSIGNED_INT, 0);

  gl.useProgram(pScreen);
  glBindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(FRAMEBUFFER, null);
  gl.drawArrays(TRIANGLES, 0, 6)

  t++;
}

window.onclick = loop;

loop();
