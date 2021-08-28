import * as g0 from "./g0/gl"
import { gl } from "./g0/gl";
import * as gc from "./g0/glconst";
import * as v3 from "./g0/vec3"
import shaders from "./shaders"
import * as m4 from "./g0/mat4"
import { Elements } from "./g0/shape";
import { Z } from "./g0/misc";
import { Vec3 } from "./g0/vec3";

let
  pMain: WebGLProgram, pScreen: WebGLProgram,
  pMainUniform: g0.Uniforms, pScreenUniform: g0.Uniforms,
  textures: g0.Texture[], framebuffer:WebGLFramebuffer;

export function init([width, height]:[number, number]) {
  let C = document.getElementById("C") as HTMLCanvasElement;

  C.width = width;
  C.height = height;
  
  g0.context(C);
  
  pMain = g0.compile(shaders.vMain, shaders.fMain);
  pMainUniform = g0.uniforms(pMain);

  pScreen = g0.compile(shaders.vScreenQuad, shaders.fScreen);
  pScreenUniform = g0.uniforms(pScreen);

  textures = g0.textures([g0.TEX_RGBA, g0.TEX_RGBA, g0.TEX_DEPTHS], [width, height])

  framebuffer = g0.framebuffer(textures);

  return [pMain, C] as [WebGLProgram, HTMLCanvasElement]
}

export function frame(mCamera:number[], [bufs, elements]:[g0.ShapeBuffers, Elements]) {
  let startTime = Date.now();

  gl.useProgram(pMain);

  pMainUniform.camera(mCamera);
  pMainUniform.sun(...v3.norm([1, 1, -1]));

  gl.bindFramebuffer(gc.FRAMEBUFFER, framebuffer);
  gl.drawBuffers([
    gc.COLOR_ATTACHMENT0,
    gc.COLOR_ATTACHMENT1
  ]);
  gl.clear(gc.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);
  gl.drawElements(gc.TRIANGLES, elements.faces.length, gc.UNSIGNED_INT, 0);

  gl.useProgram(pScreen);
  g0.bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(gc.FRAMEBUFFER, null);
  gl.drawArrays(gc.TRIANGLES, 0, 6)

  gl.flush()

  //console.log(`Rendered in ${Date.now() - startTime} ms`);

}

export function camera(at:Vec3, dir:Vec3, [width, height]:[number, number]){
  const fov = (50 * Math.PI) / 180;
  const aspect = width / height;
  const zNear = 10;
  const zFar = 3000;
  const look = m4.lookAt(at, v3.sum(at,dir), v3.axis[Z]);
  
  const mPerspective = m4.perspective(fov, aspect, zNear, zFar);
  const mCamera = m4.multiply(mPerspective, m4.inverse(look));  
  return mCamera;
}
