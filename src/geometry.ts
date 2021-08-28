import * as v3 from "./g0/vec3"
import * as m4 from "./g0/mat4"
import * as shape from "./g0/shape"
import { createDatabuffers, putShapesInElementBuffers, setAttrDatabuffers, setDatabuffers, ShapeBuffers } from "./g0/gl";
import { arr, RNG, X, Y, Z } from "./g0/misc";
import { Vec2 } from "./g0/vec";
import { Shape } from "./g0/shape";

export function initGeometry(){

  let world = generateCity();

  let divs = 40, r = 2000;
  let ball = shape.mesh(divs, divs, shape.revolutionShader(arr(divs + 1).map(row => {
    let a = row / divs * Math.PI;
    let [x, y] = [Math.sin(a) * r, Math.sin(a - Math.PI / 2) * r + 15];
    return [x, y];
  }), divs))

  let wing = shape.towerMesh(
    shape.smoothPoly([[0, -4], [14, -5], [0, 3], [-14, -5]], 0.1),
    [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.5], [0, 1.5]]
  );
  shape.transformShape(wing, m4.translation([0, 13, 5]));

  let body = shape.towerMesh(
    shape.smoothPoly([[3, -4], [0, 10], [-3, -4]], 0.2),
    [[0, 1], [0.8, 1], [1, 2], [1, 3], [0.4, 4], [0, 4]]
  )
  shape.transformShape(body, m4.translation([0, 12, 4]));

  let flyer = shape.combine([body, wing])
  shape.transformShape(flyer, m4.scaling(0.25), m4.axisRotation([0,-1,0], 0.45), m4.translation([20, -60, 290]));

  world.push(flyer);

  calculateAllNormals(world);

  return world;
}

function generateCity() {
  let shapes: shape.Shape[] = []

  let rng = RNG(1);

  function generate() {
    for (let i = 0; i < 10000; i++) {
      let [curve, types] = generateBuildingCurve(rng);
      let sectors = (rng(4) + 2) * 2;
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

  const generateBuildingCurve = (rng: (v?: number) => number) => {
    let [x, y] = [rng() * 15 + 5, 0];
    let curve = [[0, 0], [x, 0]] as Vec2[];
    let types = [0] as number[];
    // 0 = horisontal, 1 - diagonal, 2 - vertical
    let w = 2;
    while (rng(4) || curve.length < 4) {
      let mx = w <= 1 ? 0.8 - rng() * 0.4 : 1
      let dy = w >= 1 ? (rng() + 0.3) ** 2 * 2.5 * x : 0;
      x *= mx;
      y += dy;
      curve.push([x, y]);
      types.push(mx > 0.5 && dy ? 2 : 0)
      w = rng(5);
    }
    curve.push([0, y + (rng(4) - 1) * x]);
    return [curve, types] as [Vec2[], number[]];
  }

  function calculateGeometry() {
    generate();
    flatCity(shapes, rng);
  }

  calculateGeometry();

  return shapes;
}

function calculateAllNormals(shapes: shape.Shape[]) {
  for (let p of shapes)
    shape.calculateFlatNormals(p);
}

export function putWorldnBuffers(world:any, pMain:WebGLProgram){
  let [bufs, elements] = putShapesInElementBuffers(world, { at: 3, norm: 3, cell: 3, type: 1 });

  setAttrDatabuffers(bufs, pMain);

  return [bufs, elements] as  [ShapeBuffers, shape.Elements];  
}

function tunnelCity(shapes:Shape[], rng:(n?:number)=>number) {
  for (let i = 0; i < shapes.length; i++){
    let a = i / 1000 + rng();
    shape.transformShape(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * 6),
      m4.translation([0,15*(i%200-100)+1200,-400]),
      m4.axisRotation(v3.axis[Y], a),
      m4.translation([0,0,400]),
    );
  }
}

function inceptionCity(shapes:Shape[], rng:(n?:number)=>number) {
  for (let i = 0; i < shapes.length; i++){
    let a = i / 5000;
    shape.transformShape(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * 6),
      m4.translation([15*(i%200-100),0,-600]),
      m4.axisRotation(v3.axis[X], a),
      m4.translation([0,0,600]),
    );
  }
}

function flatCity(shapes:Shape[], rng:(n?:number)=>number) {
  for (let i = 0; i < shapes.length; i++){
    shape.transformShape(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * 6),
      m4.translation([i/5 - 1000 + rng(),15*(i%200-100)+1200,0]),
    );
  }
}

