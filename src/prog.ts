//@ts-check  

import * as gc from "./g0/glconst";
import { gl } from "./g0/gl";
import * as g0 from "./g0/gl"
import * as v3 from "./g0/vec3"
import * as vec from "./g0/vec"
import * as m4 from "./g0/mat4"
import * as shape from "./g0/shape"
import shaders from "./shaders"
import { arr, RNG, X, Y } from "./g0/misc";
import { Vec2 } from "./g0/vec";

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
const zNear = 10;
const zFar = 3000;
const look = m4.lookAt([0, -300, 300], [0, 500, 0], [0, 0, 1]);

const mPerspective = m4.perspective(fov, aspect, zNear, zFar);
const mCamera = m4.multiply(mPerspective, m4.inverse(look));

let world = generateCity();
//let world = [];

let divs = 20, r = 200;
let ball = shape.mesh(divs, divs, shape.revolutionShader(arr(divs + 1).map(row => {
  let a = row / divs * Math.PI;
  let [x, y] = [Math.sin(a) * r, Math.sin(a - Math.PI / 2) * r + 15];
  return [x, y];
}), divs))

let wing = shape.towerMesh(
  shape.smoothPoly([[0, -4], [14, -5], [0, 3], [-14, -5]], 0.1),
  [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.5], [0, 1.5]]
);
shape.transformShape(m4.translation([0, 13, 5]), wing);


let body = shape.towerMesh(
  shape.smoothPoly([[3, -5], [0, 5], [-3, -5]], 0.2),
  [[0, 0], [0.8, 0], [1, 2], [1, 4], [0.4, 5], [0, 5]]
)
shape.transformShape(m4.translation([0, 12, 4]), body);

let flyer = shape.combine([body, wing])

world.push(flyer);

calculateAllNormals(world);

let { bufs, elements } = putShapesInElementBuffers(world, { at: 3, norm: 3, cell: 3, type: 1 });

//console.log(bufs, elements);

console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);

g0.setAttrDatabuffers(bufs, pMain);

function loop() {

  startTime = Date.now();

  gl.useProgram(pMain);

  pMainUniform.camera(mCamera);
  pMainUniform.sun(...v3.norm([-1, 1, -1]));

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

  const generateBuildingCurve = (rng: (v?: number) => number) => {
    let [x, y] = [rng() * 20 + 5, 0];
    let curve = [[0, 0]] as Vec2[];
    let types = [] as number[];
    // 0 = horisontal, 1 - diagonal, 2 - vertical
    let w = 2;
    while (rng(4) || curve.length == 0) {
      curve.push([x, y]);
      let mx = w <= 1 ? 0.8 - rng() * 0.4 : 1
      let dy = w >= 1 ? (rng() + 0.3) ** 2 * 2 * x : 0;
      x *= mx;
      y += dy;
      types.push(mx > 0.2 ? 2 : 0)
      w = rng(5);
    }
    curve.push([0, y]);
    return [curve, types] as [Vec2[], number[]];
  }

  function generate() {
    for (let i = 0; i < 10000; i++) {
      let [curve, types] = generateBuildingCurve(rng);
      let sectors = (~~(rng(5)) + 3) * 2;
      let building = shape.mesh(sectors, curve.length - 1, shape.biRevolutionShader(curve, sectors, rng()));
      for (let v of building.verts) {
        v.type = types[v.cell[Y]];
        //debugger;
        //v.type = (v.cell[Y]%3==0)?2:0;
        //v.type = Math.random()>0.9?2:0;
      }
      shapes.push(building);
    }
  }

  function transformShapes() {
    for (let i = 0; i < 10000; i++) {
      let s = shapes[i]
      let mat = m4.multiply(
        m4.translation([10 * (i % 100 * 2 - 100), i / 4, 0]),
        m4.axisRotation([0, 0, 1], rng() * 6)
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




