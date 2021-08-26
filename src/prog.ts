//@ts-check  

import * as gc from "./g0/glconst";
import { gl } from "./g0/gl";
import * as g0 from "./g0/gl"
import * as v from "./g0/v3"
import * as m from "./g0/m4"
import * as shape from "./g0/shape"
import shaders from "./shaders"
import { arr, RNG } from "./g0/misc";

const width = 1600, height = 800;

let C = document.getElementById("C") as HTMLCanvasElement;

C.width = width;
C.height = height;

g0.context(C);

let startTime = Date.now();

let pMain = g0.compile(shaders.vMain, shaders.fMain);
let pMainUniform = g0.uniforms(pMain);

let pScreen = g0.compile(shaders.vScreenQuad, shaders.fScreen);
let pScreenUniform = g0.uniforms(pScreen);

let textures = g0.textures([g0.TEX_RGBA, g0.TEX_RGBA, g0.TEX_DEPTHS], [width, height])

let framebuffer = g0.framebuffer(textures);

let t = 0;

const fov = (50 * Math.PI) / 180;
const aspect = width / height;
const zNear = 2;
const zFar = 200;
const look = m.lookAt([0, -20, 30], [0, 30, 0], [0, 0, 1]);

const mPerspective = m.perspective(fov, aspect, zNear, zFar);
const mCamera = m.multiply(mPerspective, m.inverse(look));

let world = generateCity();

let divs = 20, r = 5;
let ball = shape.mesh(divs, divs, shape.revolutionShader(arr(divs + 1).map(row => {
  let a = row / divs * Math.PI;
  let [x,y] = [Math.sin(a)*r, Math.sin(a - Math.PI/2)*r+15];
  console.log(row, a, x, y);
  //let x = Math.cos(a) * r;
  //let y = Math.sin(a) * r + 10;
  return [x,y];
}), divs))

//console.log(ball);

//let ball = shape.mesh(10, 10, (x,y)=>[x+y, x-y, y])

//let world = [ball];

world.push(ball);

calculateAllNormals(world);

let { bufs, elements } = putShapesInElementBuffers(world, shape.defaultAttrs);

console.log(bufs, elements);

console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);

g0.setAttrDatabuffers(bufs, pMain);

function loop() {

  startTime = Date.now();

  gl.useProgram(pMain);

  pMainUniform.camera(mCamera);
  pMainUniform.sun(...v.norm([-1, 1, -1]));

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

  t++;

  gl.flush()

  console.log(`Rendered in ${Date.now() - startTime} ms`);
}

window.onclick = loop;

loop();

function generateCity() {
  let shapes: shape.Shape[] = []

  let rng = RNG(1);

  function generate() {
    for (let i = 0; i < 10000; i++) {
      let curve = shape.generateCurve(rng);
      let sectors = (~~(rng(5)) + 3) * 2;
      shapes.push(shape.mesh(sectors, curve.length - 1, shape.biRevolutionShader(curve, sectors, 0.7)));
    }
  }

  function transformShapes() {
    for (let i = 0; i < 10000; i++) {
      let s = shapes[i]
      let mat = m.multiply(
        m.translation([i % 100 - 50, i / 30, 0]),
        m.axisRotation([0, 0, 1], rng() * 6)
      );
      shape.transformShape(mat, s);
    }
  }

  function calculateGeometry() {
    generate();
    transformShapes();
  }

  calculateGeometry();

  return shapes;
}


function calculateAllNormals(shapes: shape.Shape[]) {
  for (let p of shapes)
    shape.calculateFlatNormals(p);
}

function putShapesInElementBuffers(shapes: shape.Shape[], attrs: { [k: string]: number }) {
  let elements = shape.shapesToElements(shapes, attrs);
  let bufs = g0.createDatabuffers(attrs);
  g0.setDatabuffers(bufs, elements);
  return { bufs, elements };
}
