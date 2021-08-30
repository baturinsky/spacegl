import * as v3 from "./g0/v3"
import * as v from "./g0/v"
import * as m4 from "./g0/m4"
import * as shape from "./g0/shape"
import { putShapesInElementBuffers, setAttrDatabuffers, ShapeBuffers } from "./g0/gl";
import { arr, arrm, PI, PI2, PIH, RNG, X, Y, Z } from "./g0/misc";
import { Vec2 } from "./g0/v";
import { Shape, towerMesh } from "./g0/shape";

const ts = shape.transformShape;

export function putWorldnBuffers(world: any, pMain: WebGLProgram) {
  let [bufs, elements] = putShapesInElementBuffers(world, { at: 3, norm: 3, cell: 3, type: 1, shape: 1 });

  setAttrDatabuffers(bufs, pMain);

  return [bufs, elements] as [ShapeBuffers, shape.Elements];
}


export function initGeometry() {

  let world = generateCity();
  //let world: Shape[] = [];

  let tunnel = tunnelGeometry(20, 400, 440, 2000);
  for (let v of tunnel.verts)
    v.type = 4;
  ts(tunnel, m4.axisRotation(v3.axis[X], -Math.PI / 2))

  world.push(tunnel)

  let flyer = flyerGeometry();

  world.push(flyer);

  calculateAllNormals(world);

  return world;
}

function flyerGeometry() {
  let wing = towerMesh(
    shape.smoothPoly([[0, -4], [10, -5], [0, 3], [-10, -5]], 0.1),
    [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.5], [0, 1.5]]
  );
  ts(wing, m4.translation([0, 13, 5]));

  let body = towerMesh(
    shape.smoothPoly([[3, -4], [0, 10], [-3, -4]], 0.2),
    [[0, 1], [0.8, 1], [1, 2], [1, 3], [0.4, 4], [0, 4]]
  )
  ts(body, m4.translation([0, 12, 4]));

  let flyer = shape.combine([body, wing])

  for (let v of flyer.verts)
    v.type = 3;

  //ts(flyer, m4.scaling(0.25)/*, m4.axisRotation([0,-1,0], 0.45), m4.translation([0, 0, 0])*/);
  ts(flyer,
    m4.scaling(0.25),
    m4.axisRotation([0, -1, 0], Math.PI),
    m4.axisRotation([-1, 0, 0], Math.PI / 2),
    m4.translation([0, 3, 0])
  );

  return flyer;
}

function generateCity() {
  let shapes: shape.Shape[] = []

  let rng = RNG(1);

  function generate() {
    for (let i = 0; i < 10000; i++) {
      let r = rng() * 15 + 5;
      let [curve, types] = generateBuildingCurve(r, rng);
      let sectors = (rng(4) + 2) * 2;
      //let building = shape.mesh(sectors, curve.length - 1, shape.biRevolutionShader(curve, sectors, rng()));
      //let building = towerMesh(arrm(sectors, a => v.muleach(shape.biRevolutionShader(sectors, rng())(a), [2,1])), curve);
      let building = towerMesh(arrm(sectors, a => v.sum(shape.biRevolutionShader(sectors, rng())(a), [1,0])), curve);
      for (let v of building.verts) {
        v.type = types[v.cell[Y]];
        v.shape = i;
      }
      shapes.push(building);
    }
  }

  const generateBuildingCurve = (r:number, rng: (v?: number) => number) => {
    let [x, y] = [r, 0];
    let curve = [[0, 0], [x, 0]] as Vec2[];
    let types = [0] as number[];
    // 0 = horisontal, 1 - diagonal, 2 - vertical
    let w = 2;
    while (rng(3) || curve.length < 4) {
      let mx = w <= 1 ? 0.8 - rng() * 0.4 : 1
      let dy = w * x * 2.5 * (rng() + 0.3) ** 2;
      x *= mx;
      y += dy;
      curve.push([x, y]);
      types.push(mx > 0.5 && dy ? 2 : 0)
      w = rng(3);
    }
    curve.push([0, y + (rng(4) - 1) * x]);
    return [curve, types] as [Vec2[], number[]];
  }

  function calculateGeometry() {
    generate();
    tunnelCity(shapes, rng);
  }

  calculateGeometry();

  return shapes;
}

function calculateAllNormals(shapes: shape.Shape[]) {
  for (let p of shapes)
    shape.calculateFlatNormals(p);
}

function tunnelCity(shapes: Shape[], rng: (n?: number) => number) {
  for (let i = 0; i < shapes.length; i++) {
    let a = i / 1000 + rng();
    ts(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * 6),
      m4.translation([0, 20 * (i % 100 + 1), -400]),
      m4.axisRotation(v3.axis[Y], a)
    );
  }
}

function inceptionCity(shapes: Shape[], rng: (n?: number) => number) {
  for (let i = 0; i < shapes.length; i++) {
    let a = i / 5000;
    ts(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * 6),
      m4.translation([15 * (i % 200 - 100), 0, -600]),
      m4.axisRotation(v3.axis[X], a),
      m4.translation([0, 0, 600]),
    );
  }
}

function flatCity(shapes: Shape[], rng: (n?: number) => number) {
  for (let i = 0; i < shapes.length; i++) {
    ts(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * 6),
      m4.translation([i / 5 - 1000 + rng(), 15 * (i % 200 - 100) + 1200, 0]),
    );
  }
}

function tunnelGeometry(divs: number, r1: number, r2: number, h: number) {
  return shape.towerMesh(
    arrm(divs, i => v.angle2d(i / (divs - 1) * PI2)),
    [[r1, 0], [r2, 0], [r2, h], [r1, h], [r1, 0]]
  )
}

function sphere(divs: number, r: number) {
  let sphere = towerMesh(
    arrm(divs, col => v.angle2d(col / (divs - 1) * PI2)), 
    arrm(divs, row => v.scale(v.angle2d(row / (divs - 1) * PI - PIH), r))
  )
  return sphere;
}