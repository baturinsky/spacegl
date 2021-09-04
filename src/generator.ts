import * as v3 from "./g0/v3"
import * as v from "./g0/v"
import * as m4 from "./g0/m4"
import * as shape from "./g0/shape"
import * as gc from "./g0/glconst";
import { putShapesInElementBuffers, setAttrDatabuffers, ShapeBuffers } from "./g0/gl";
import { range, rangef, PI, PI2, PIH, RNG, X, Y, Z, hexFromDigits } from "./g0/misc";
import { Vec2, Vec4 } from "./g0/v";
import { Shape, towerMesh, towerShader, towerXShader } from "./g0/shape";

const ts = shape.transformShape;

export const cityCols = 72,
  cityRows = 120,
  cityRadius = 400,
  cityRowGap = 40,
  citySize = cityCols * cityRows,
  cityDepth = cityRows * cityRowGap;

let rng: (n?: number) => number;

export function putWorldnBuffers(world: any, pMain: WebGLProgram) {
  let [bufs, elements] = putShapesInElementBuffers(world, { at: [3], norm: [3], cell: [3], type: [4], shape: [1] });

  setAttrDatabuffers(bufs, pMain);

  return [bufs, elements] as [ShapeBuffers, shape.Elements];
}


export function initGeometry() {

  let world = generateCity();
  //let world: Shape[] = [];

  let flyer = flyerGeometry();

  world.push(flyer);

  calculateAllNormals(world);

  return world;
}

function flyerGeometry() {
  let wing = towerMesh(
    shape.smoothPolyFixed([[0, -4], [7, -5], [0, 3], [-7, -5]], 2),
    [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.5], [0, 1.5]]
  );
  ts(wing, m4.translation([0, 13, 5]));

  let body = towerMesh(
    shape.smoothPolyFixed([[3, -4], [0, 10], [-3, -4]], 2),
    [[0, 1], [0.8, 1], [1, 2], [1, 3], [0.4, 4], [0, 4]]
  )
  ts(body, m4.translation([0, 12, 4]));

  let flyer = shape.combine([body, wing])

  for (let v of flyer.verts)
    v.type = [3, 0, 0, 0];

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

  rng = RNG(1);

  function calculateGeometry() {
    let buildings = generateBuildings();
    tunnelCity(buildings, rng);
    buildings.forEach(b => b && shapes.push(b));
  }

  calculateGeometry();

  let tunnel = tunnelGeometry(cityCols, cityRadius, cityRadius * 1.3, cityRows * cityRowGap);
  ts(tunnel, m4.axisRotation(v3.axis[X], -Math.PI / 2))

  shapes.push(tunnel)

  return shapes;
}

function calculateAllNormals(shapes: Shape[]) {
  for (let p of shapes)
    shape.calculateFlatNormals(p);
}

function tunnelGeometry(divs: number, r1: number, r2: number, h: number) {
  let circle = shape.circle(divs);
  /*let core = towerMesh(
    circle,
    [[r1, 0], [r2, 0], [r2, h], [r1, h], [r1, 0]]
  )*/
  let horns: Shape[] = [];
  for (let i = 0; i < divs - 1; i++) {
    let hh = rng() * 1000;
    let choke = ((i / divs * 6)) % 1 < 0.5 ? 0.8 : 1;
    let horn = towerMesh([
      v.scale(circle[i], r1),
      v.scale(circle[(i + 1) % divs], r1),
      v.scale(circle[(i + 1) % divs], r2),
      v.scale(circle[i], r2),
    ].reverse(), [[1, -hh], [1, h * 0.96], [choke, h * 0.98], [choke, h * 1.03]])
    horns.push(horn);
  }

  let warper = towerMesh(circle, [[0, h], [r2, h], [r2 * 1.2, h], [r2 * 1.2, h * 1.2], [0, h * 1.2]])

  for (let v of warper.verts)
    if (v.cell[Y] == 0) v.type = [5, 0, 0, 0];

  let combined = shape.combine([warper, ...horns]);
  for (let v of combined.verts)
    v.type = v.type || [4, 0, 0, 0];

  return combined;
}

function sphere(divs: number, r: number) {
  let sphere = towerMesh(
    rangef(divs, col => v.angle2d(col / (divs - 1) * PI2)),
    rangef(divs, row => v.scale(v.angle2d(row / (divs - 1) * PI - PIH), r))
  )
  return sphere;
}

function roundTower(r: number, i: number) {
  let [curve, types] = generateBuildingCurve(rng, 1, r);
  let sectors = (rng(4) + 2) * 2;
  let slice = rangef(sectors, a => shape.biRevolutionShader(sectors, rng())(a));
  let building = shape.twoCurvesMesh(slice, curve, towerShader);
  for (let v of building.verts) {
    v.type = types[v.cell[Y]];
    v.shape = i;
  }
  return building;
}

function roundTower2(r: number, i: number, size: number) {
  let [curve, types] = generateBuildingCurve(rng, size, r);

  let sectors = (rng(4) + 4);
  let slice: Vec2[];

  slice = rangef(sectors, a => shape.revolutionShader(sectors)(a));

  if (!rng(3))
    slice = shape.smoothPoly(slice, 0.1);

  if (rng(4) == 0)
    slice.forEach(v => v[Y] += 0.95);

  let building = shape.twoCurvesMesh(slice, curve, towerShader);
  for (let v of building.verts) {
    v.type = types[v.cell[Y]];
    v.shape = i;
  }
  return building;
}

function generateBuildings() {
  let buildings: Shape[] = [];
  for (let i = 0; i < citySize; i++) {
    let a = (i % cityCols) / cityCols * PI2;
    let s = Math.sin(a * 6 + PI / 2);
    let density = Math.min(1.4 - Math.abs(0.5 - i / citySize) * 3, s * 0.5 + 1);
    if (density > rng()) {
      let r = 10 + rng(10);
      if (!rng(100))
        r *= 2;
      let building = roundTower2(r, i, density * 15 / r);
      buildings[i] = building;
    }
  }
  return buildings;
}

function tunnelCity(shapes: Shape[], rng: (n?: number) => number) {
  for (let i = 0; i < citySize; i++) {
    if (!shapes[i])
      continue;
    let a = (i % cityCols) / cityCols * PI2;
    ts(shapes[i],
      m4.axisRotation(v3.axis[Z], rng() * PI2),
      m4.translation([0, i / citySize * cityDepth, -cityRadius]),
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

const HM = 0, VM = 1, HB = 2, VB = 3;

function generateBuildingCurve(rng: (v?: number) => number, size: number, r: number) {
  let [x, y] = [1, 0];
  let curve = [[0, 0], [x * r, 0]] as Vec2[];
  let types = [[0, 0, 0, 0]] as Vec4[];
  // 0 = horisontal, 1 - diagonal, 2+ - vertical
  let w = 2, b = 0;
  let gaps = [rng(6) + 2, rng(6) + 2, rng(6), rng(6)];
  let windowDensity = [r * (rng() + 0.3), r * (rng() + 0.3) / 2]
  while (x > 0.2 && y < 20 * size && (y < 10 * size || rng(3) || curve.length < 4)) {
    let dx = w > 1 ? 0 : x * (0.1 + rng() * 0.5) * (rng(4) ? -1 : 1);
    if (x + dx > 1)
      dx = -dx;
    let dy = w * (x + (b++) / 10) * (rng() + 0.3) ** 2;
    if (y < 5 && dy > 0)
      dy++;
    x += dx;
    y += dy;
    if (y > 20 * size)
      y = (20 + rng()*3) * size;
    curve.push([x * r, y * r]);
    let cols = ~~(dy * windowDensity[0]) || 1;
    let rows = ~~(x *  windowDensity[1]) || 1;

    let windowArea = (1 - gaps[HM]/15) * (1 - gaps[VM]/15) /** (1 - g[HB]*0.1) * (1 - g[VB]*0.1)*/;

    if(dx !=0 )
      cols = 1;

    types.push([
      2,
      cols * 256 + rows,
      hexFromDigits(gaps),
      windowArea * 256
    ])

    let nw = rng(3);
    w = (nw == 0 && w == 0) ? 2 : nw;
  }
  curve.push([0, y * r]);
  types.push([2, 0x0808, 0xE000, 0])
  return [curve, types] as [Vec2[], Vec4[]];
}

function generateShipPart(){
  
}

//console.log(2.0101000300*1e7%1e1/1e7);