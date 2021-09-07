import * as g0 from "./g0/gl"
import { gl } from "./g0/gl";
import * as gc from "./g0/glconst";
import * as v3 from "./g0/v3"
import shaders from "./shaders"
import * as m4 from "./g0/m4"
import { Elements } from "./g0/shape";
import { PI, X, Y, Z } from "./g0/misc";
import { Vec3 } from "./g0/v3";
import * as game from "./game"
import { dist, Vec2, mulEach } from "./g0/v";
import { cityDepth } from "./generator";

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

const crashPoints: Vec3[] = [[-1.1, 1, -1], [1.1, 1, -1], [0, 1, -2]];

export function frame(state: game.State,
  [bufs, elements]: [g0.ShapeBuffers, Elements],
  [bufsF, elementsF]: [g0.ShapeBuffers, Elements]) {
  I.innerHTML = "LMB click to speed up, RMB to speed down. " + state.at.map(v => ~~v);

  let time = state.time;
  let camera = m4.camera(
    v3.sum(v3.sum(state.at, v3.scale(state.dir, -5)), [0, 0, 0]),
    state.dir,
    viewSize,
    PI / 4,
    [4, cityDepth + dist(state.at, [0, cityDepth * 0.5, 0])]
  );
  let invCamera = m4.inverse(camera);


  //let flyer = m4.lookTo(state.pos, state.dir);
  //fdir[Z] = 0;
  let flyer = m4.lookTo(state.at, state.dir, [0, 0, 1]);
  flyer = m4.multiply(flyer, m4.axisRotation([0, 0, 1], -(state.smoothDrot[X]) * Math.PI / 4 / 100));
  flyer = m4.multiply(flyer, m4.axisRotation([1, 0, 0], -(state.smoothDrot[Y]) * Math.PI / 4 / 200));

  let screenCrashPoints = crashPoints.map(p => {
    let a = m4.transform(camera, m4.transform(flyer, p));
    a[X] = ~~((a[X]*0.5+0.5)*viewSize[X]);
    a[Y] = ~~((a[Y]*0.5+0.5)*viewSize[Y]);
    a[Z] = 0;
    return a;
  });

  //I.innerHTML = screenCrashPoints.flat().map(v => v.toFixed(5));

  let startTime = Date.now();


  gl.useProgram(pMain);


  g0.setUniforms(pMainUniform, { camera, flyer, sun: [0, cityDepth, 0], time })

  gl.bindFramebuffer(gc.FRAMEBUFFER, framebuffer);
  gl.clear(gc.DEPTH_BUFFER_BIT | gc.COLOR_BUFFER_BIT);
  gl.drawBuffers([
    gc.COLOR_ATTACHMENT0,
    gc.COLOR_ATTACHMENT1
  ]);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);
  g0.setAttrDatabuffers(bufs, pMain);
  gl.drawElements(gc.TRIANGLES, elements.faces.length, gc.UNSIGNED_INT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufsF.faces);
  g0.setAttrDatabuffers(bufsF, pMain);
  gl.drawElements(gc.TRIANGLES, elementsF.faces.length, gc.UNSIGNED_INT, 0);

  gl.useProgram(pScreen);
  g0.setUniforms(pScreenUniform, {
    invCamera, flyer, time,
    scp0: screenCrashPoints[0], scp1: screenCrashPoints[1], scp2: screenCrashPoints[2]
  })

  g0.bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(gc.FRAMEBUFFER, null);
  gl.drawArrays(gc.TRIANGLES, 0, 6)

  gl.flush();

  let pixels = new Uint8Array(40);
  gl.readPixels(1, 1, 1, 1, gc.RGBA, gc.UNSIGNED_BYTE, pixels);
  if(pixels[0] == 255){
    console.log("CRASH");
  }

  gl.flush()

  //console.log(`Rendered in ${Date.now() - startTime} ms`);

}

