//@ts-check  

import { COLOR_ATTACHMENT0, COLOR_ATTACHMENT1, DEPTH_BUFFER_BIT, FRAGMENT_SHADER, FRAMEBUFFER, VERTEX_SHADER } from "./glconsts";
import { gl, glFramebuffer, glCompile, gl2Shader, glUniforms, glBindTextures, glTexture, glContext, glDrawQuad, TEX_RGBA, TEX_DEPTHS, glDatabuffer, glSetDatabuffer, glAttr } from "./gllib"
import shaders from "./shaders"
import { arr, mInverse, mLook, mMul, mPerspective, mSet, mvMul } from "./math3d";
import { m4 } from "./twgl/twgl-full.js";

console.log("mset", mSet([1, 2, 3], { 1: 5 }));

const width = 800, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

glContext(C);

/*let vertBuf = glDatabuffer();
let data = arr(6).map(i=>[i%2*2-1, 1-~~((i+1)%4/2)*2, 0]).flat();
glSetDatabuffer(vertBuf, new Float32Array(data));*/

console.log("voices", speechSynthesis.getVoices());

const vFullScreenQuad = gl2Shader(VERTEX_SHADER, shaders.screenQuad);

let textures = [0, 1].map(_ => [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map(
  (tex) => glTexture(width, height, tex)
))
let buffers = textures.map(textures => glFramebuffer(textures))

let t = 0;

let pm = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, `${shaders.gradient}\n${shaders.main}`));
let pmUniform = glUniforms(pm);

let ps = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders.screen));
let psUniform = glUniforms(ps);

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 0.5;
const zFar = 800;

const projection = mPerspective(fov, aspect, zNear, zFar);
const camera = mLook([0, 0, 1]);
const view = mInverse(camera);
const viewProjection = mMul(projection, view);

//pmUniform.view(viewProjection);

const projection2 = m4.perspective(fov, aspect, zNear, zFar)
const camera2 = m4.lookAt([0, 0, 0], [0, 0, 1], [0, 1, 0]);
const view2 = m4.inverse(camera2);
const viewProjection2 = m4.multiply(projection2, view2);

console.log("p", mvMul(viewProjection, [0, 0, 10]));

function loop() {
  gl.useProgram(pm);

  pmUniform.t(t);

  //glAttr(pm, "vert", vertBuf, 3);

  gl.bindFramebuffer(FRAMEBUFFER, buffers[1]);
  gl.drawBuffers([
    COLOR_ATTACHMENT0,
    COLOR_ATTACHMENT1
  ]);
  gl.clear(DEPTH_BUFFER_BIT);
  glDrawQuad();

  gl.useProgram(ps);

  glBindTextures(textures[1], [psUniform.T0, psUniform.T1, psUniform.Depth]);

  gl.bindFramebuffer(FRAMEBUFFER, null);

  glDrawQuad();

  buffers = buffers.reverse();
  textures = textures.reverse();

  t++;
}

window.onclick = loop;

loop();
