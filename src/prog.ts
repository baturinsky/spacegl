//@ts-check  

import { COLOR_ATTACHMENT0, COLOR_ATTACHMENT1, COLOR_ATTACHMENT2, DEPTH_BUFFER_BIT, FRAGMENT_SHADER, FRAMEBUFFER, RENDERBUFFER, TEXTURE_2D, VERTEX_SHADER } from "./glconsts";
import { gl, glFramebuffer, glCompile, gl2Shader, glUniforms, glBindTextures, glTexture, glContext, glDrawQuad, TEX_RGBA16F, TEX_RGBA, glRenderbuffer, TEX_DEPTHF, glShowErrors, TEX_DEPTH_STENCILF, TEX_DEPTH, TEX_DEPTHI, TEX_DEPTHS, readTextureData } from "./gllib"
import shaders from "./shaders"
import {mSet} from "./math3d";

console.log("mset", mSet([1,2,3], {1:5}));

const width = 800, height = 800;

C.width = width;
C.height = height;

glContext(C);

gl.getExtension('EXT_color_buffer_float');

const vFullScreenQuad = gl2Shader(
  VERTEX_SHADER,
  `
void main() {
  int i = gl_VertexID;
  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, float(i%2*2-1)*2.+1., 1.);
}`
);

let textures = [0, 1].map(_ => [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map(
  (tex) => glTexture(width, height, tex)
))
let buffers = textures.map(textures => glFramebuffer(textures))

let t = 0;

let pm = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, `${shaders.gradient}\n${shaders.main}`));
let pmUniform = glUniforms(pm);

let ps = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders.screen));
let psUniform = glUniforms(ps);

function loop() {
  gl.useProgram(pm);
  
  pmUniform.t(t);

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
