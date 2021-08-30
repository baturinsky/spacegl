import * as g0 from "./g0/gl"
import { gl } from "./g0/gl";
import * as gc from "./g0/glconst";
import * as v3 from "./g0/v3"
import shaders from "./shaders"
import * as m4 from "./g0/m4"
import { Elements } from "./g0/shape";
import { X, Y, Z } from "./g0/misc";
import { Vec3 } from "./g0/v3";
import * as game from "./game"
import { Vec2 } from "./g0/v";

let
  pMain: WebGLProgram, pScreen: WebGLProgram,
  pMainUniform: g0.Uniforms, pScreenUniform: g0.Uniforms,
  textures: g0.Texture[], framebuffer: WebGLFramebuffer,
  viewSize: Vec2;

export function init(size: Vec2) {
  let C = document.getElementById("C") as HTMLCanvasElement;

  viewSize = size;

  C.width = viewSize[X];
  C.height = viewSize[Y];

  g0.context(C);

  pMain = g0.compile(shaders.vMain, shaders.fMain);
  pMainUniform = g0.uniforms(pMain);

  pScreen = g0.compile(shaders.vScreenQuad, shaders.fScreen);
  pScreenUniform = g0.uniforms(pScreen);

  textures = g0.textures([g0.TEX_RGBA, g0.TEX_RGBA, g0.TEX_DEPTHS], viewSize)

  framebuffer = g0.framebuffer(textures);

  return [pMain, C] as [WebGLProgram, HTMLCanvasElement]
}

export function frame(state: game.State, [bufs, elements]: [g0.ShapeBuffers, Elements]) {
  let camera = m4.camera(v3.sum(v3.sum(state.pos, v3.scale(state.dir, -5)), [0,0,0]), state.dir, viewSize);
  //let flyer = m4.lookTo(state.pos, state.dir);
  let fdir = [...state.dir] as Vec3;
  //fdir[Z] = 0;
  let flyer = m4.lookTo(state.pos, state.dir, [0, 0, 1]);
  flyer = m4.multiply(flyer, m4.axisRotation([0,0,1], -(state.smoothDrot[X])*Math.PI/4/100) );
  flyer = m4.multiply(flyer, m4.axisRotation([1,0,0], -(state.smoothDrot[Y])*Math.PI/4/200) );

  let startTime = Date.now();

  gl.useProgram(pMain);

  pMainUniform.camera(camera);
  pMainUniform.flyer(flyer);
  pMainUniform.sun(v3.norm([1, 1, -1]));

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
