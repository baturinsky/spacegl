import * as v3 from "./g0/v3"
import * as v from "./g0/v"
import * as m4 from "./g0/m4"
import * as shape from "./g0/shape"
import * as gc from "./g0/glconst";
import * as g0 from "./g0/gl";
import { range, rangef, PI, PI2, PIH, RNG, X, Y, Z, hexFromDigits, Rng } from "./g0/misc";
import { Vec2, Vec4 } from "./g0/v";
import { Shape } from "./g0/shape";

const ts = shape.transformShape;

const BUILDING = 2, FLYER = 3, TUNNEL = 4, WARPER = 5, SHIP = 7;

export const cityCols = 72,
  cityRows = 120,
  cityRadius = 400,
  cityRowGap = 40,
  citySize = cityCols * cityRows,
  cityDepth = cityRows * cityRowGap;

export function putWorldnBuffers(world: any, pMain: WebGLProgram) {
  let [bufs, elements] = g0.putShapesInElementBuffers(world, { at: [3], norm: [3], cell: [3], type: [4], shape: [1] });

  g0.setAttrDatabuffers(bufs, pMain);

  return [bufs, elements] as [g0.ShapeBuffers, shape.Elements];
}


export function initGeometry() {

  let rng = RNG(1);

  let world = generateCity(rng);
  //let world: Shape[] = [];

  let flyer = flyerGeometry();

  world.push(flyer);

  for (let i = 0; i < 300; i++) {
    let ship = shipGeometry(rng, i);
    let sector = i%6;
    ts(ship, 
      m4.axisRotation([0,1,0], PIH + (sector<3?PI:0)),
      m4.scaling(rng(5)+2),
      m4.translation([0,/*i/300*cityDepth*/0,cityRadius * (0.35 + rng()*0.15)]), 
      m4.axisRotation([0,1,0], sector*PI2/6 + PI2 * 5/12 + rng()*0.2-0.1)
    );
    world.push(ship);
  }

  calculateAllNormals(world);

  return world;
}

function flyerGeometry() {
  let wing = shape.towerMesh(
    shape.smoothPolyFixed([[0, -4], [6, -5], [0, 4], [-6, -5]], 2),
    [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.1], [0, 1.1]]
  );
  ts(wing, m4.translation([0, 13, 5]));

  let engine = shape.towerMesh(
    shape.smoothPolyFixed([[-1, 0], [1, 0], [1, 2], [-1, 2]], 0.5),
    [[0, 0], [0.8, 0], [1, 1], [1, 1], [0.5, 3], [0, 3]]
  );
  ts(engine, m4.axisRotation([1, 0, 0], -PIH), m4.translation([2, 8.5, 6.2]));

  let engine2 = shape.clone(engine);
  ts(engine2, m4.reflection([1, 0, 0]));
  shape.invert(engine2);

  /*let wing2 = generateShipPart(RNG(Date.now()), [3, 3], [[0, 4], [-2, 4]], [[1, 0], [1.5, 0.5], [1.5, 1], [1, 1.5]])
  let wing3 = shape.clone(wing2);

  ts(wing2, m4.translation([0, 13, 5]))
  ts(wing3,  m4.reflection([1,0,0]), m4.translation([0, 13, 5]))*/

  let body = shape.towerMesh(
    shape.smoothPolyFixed([[1, -4], [1, 7], [0, 10], [-1, 7], [-1, -4]], 1),
    [[0, 1], [0.8, 1], [1, 2], [1, 3], [0.4, 4], [0, 4]]
  )
  ts(body, m4.translation([0, 12, 3.5]));

  /*let body2 = generateShipPart(RNG(Date.now()), [3, 3], [[0, 5], [-2, 4]], [[1, -2], [1.5, -1], [1.5, 1], [1, 2]])
  ts(body2, m4.axisRotation([0,1,0],-PIH), m4.translation([0, 12, 4]));*/

  let flyer = shape.combine([body, wing, engine, engine2])

  for (let v of flyer.verts)
    v.type = [FLYER, 0, 0, 0];

  //ts(flyer, m4.scaling(0.25)/*, m4.axisRotation([0,-1,0], 0.45), m4.translation([0, 0, 0])*/);
  ts(flyer,
    m4.scaling(0.25),
    m4.axisRotation([0, -1, 0], Math.PI),
    m4.axisRotation([-1, 0, 0], Math.PI / 2),
    m4.translation([0, 3, 0])
  );

  return flyer;
}

function generateCity(rng: Rng) {
  let shapes: shape.Shape[] = []

  //console.log(generateShipPart());

  let buildings = generateBuildings(rng);
  tunnelCity(buildings, rng);
  buildings.forEach(b => b && shapes.push(b));

  let tunnel = tunnelGeometry(rng, cityCols, cityRadius, cityRadius * 1.3, cityRows * cityRowGap);
  ts(tunnel, m4.axisRotation(v3.axis[X], -Math.PI / 2))

  shapes.push(tunnel)

  return shapes;
}

function calculateAllNormals(shapes: Shape[]) {
  for (let p of shapes)
    shape.calculateFlatNormals(p);
}

function tunnelGeometry(rng: Rng, divs: number, r1: number, r2: number, h: number) {
  let circle = shape.circle(divs);
  /*let core = towerMesh(
    circle,
    [[r1, 0], [r2, 0], [r2, h], [r1, h], [r1, 0]]
  )*/
  let horns: Shape[] = [];
  for (let i = 0; i < divs - 1; i++) {
    let hh = rng() * 1000;
    let choke = ((i / divs * 6)) % 1 < 0.5 ? 0.8 : 1;
    let horn = shape.towerMesh([
      v.scale(circle[i], r1),
      v.scale(circle[(i + 1) % divs], r1),
      v.scale(circle[(i + 1) % divs], r2),
      v.scale(circle[i], r2),
    ].reverse(), [[1, -hh], [1, h * 0.96], [choke, h * 0.98], [choke, h * 1.03]])
    horns.push(horn);
  }

  let warper = shape.towerMesh(circle, [[0, h], [r2, h], [r2 * 1.2, h], [r2 * 1.2, h * 1.2], [0, h * 1.2]])

  for (let v of warper.verts)
    if (v.cell[Y] == 0) v.type = [WARPER, 0, 0, 0];

  let combined = shape.combine([warper, ...horns]);
  for (let v of combined.verts)
    v.type = v.type || [TUNNEL, 0, 0, 0];

  return combined;
}

function sphere(divs: number, r: number) {
  let sphere = shape.towerMesh(
    rangef(divs, col => v.angle2d(col / (divs - 1) * PI2)),
    rangef(divs, row => v.scale(v.angle2d(row / (divs - 1) * PI - PIH), r))
  )
  return sphere;
}

function roundTower(rng: Rng, r: number, i: number) {
  let [curve, types] = generateBuildingCurve(rng, 1, r);
  let sectors = (rng(4) + 2) * 2;
  let slice = rangef(sectors, a => shape.biRevolutionShader(sectors, rng())(a));
  let building = shape.twoCurvesMesh(slice, curve, shape.towerShader);
  for (let v of building.verts) {
    v.type = types[v.cell[Y]];
    v.shape = i;
  }
  return building;
}

function roundTower2(rng: Rng, r: number, i: number, size: number) {
  let [curve, types] = generateBuildingCurve(rng, size, r);

  let sectors = (rng(4) + 4);
  let slice: Vec2[];

  slice = rangef(sectors, a => shape.revolutionShader(sectors)(a));

  if (!rng(3))
    slice = shape.smoothPoly(slice, 0.1);

  if (rng(4) == 0)
    slice.forEach(v => v[Y] += 0.95);

  let building = shape.twoCurvesMesh(slice, curve, shape.towerShader);
  for (let v of building.verts) {
    v.type = types[v.cell[Y]];
    v.shape = i;
  }
  return building;
}

function generateBuildings(rng: Rng) {
  let buildings: Shape[] = [];
  for (let i = 0; i < citySize; i++) {
    let a = (i % cityCols) / cityCols * PI2;
    let s = Math.sin(a * 6 + PI / 2)*1.3;
    let density = Math.min(1.4 - Math.abs(0.5 - i / citySize) * 3, s * 0.5 + 1);
    if (density > rng()) {
      let r = 10 + rng(10);
      if (!rng(100))
        r *= 2;
      let building = roundTower2(rng, r, i, density * 13 / r);
      buildings[i] = building;
    }
  }
  return buildings;
}

function tunnelCity(shapes: Shape[], rng: Rng) {
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

function inceptionCity(shapes: Shape[], rng: Rng) {
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

function flatCity(shapes: Shape[], rng: Rng) {
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
  let windowDensity = [r * (rng() + 0.3) / 4, r * (rng() + 0.3)]
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
      y = (20 + rng() * 3) * size;
    curve.push([x * r, y * r]);
    let cols = ~~(dy * windowDensity[0]) || 1;
    let rows = ~~(x * windowDensity[1]) || 1;

    //console.log(cols,rows);

    let windowArea = (1 - gaps[HM] / 15) * (1 - gaps[VM] / 15) /** (1 - g[HB]*0.1) * (1 - g[VB]*0.1)*/;

    if (dx != 0)
      cols = 1;

    types.push([
      BUILDING,
      cols * 256 + rows,
      hexFromDigits(gaps),
      windowArea * 256
    ])

    let nw = rng(3);
    w = (nw == 0 && w == 0) ? 2 : nw;
  }
  curve.push([0, y * r]);
  types.push([BUILDING, 0x0808, 0xE000, 0])
  return [curve, types] as [Vec2[], Vec4[]];
}

function generateShipPart(rng: Rng, bends: Vec2, bounds: [Vec2, Vec2], curve: Vec2[]) {
  let sides = [rng()*bounds[Y][0], rng()*bounds[Y][1]];
  let x = bounds[0][X];
  let slices: [Vec2[], Vec2[]] = [[[x, sides[X]]], [[x, sides[Y]]]];
  let step = (bounds[X][1] - bounds[X][0]) / (bends[0] + bends[1]);
  if (step < 0)
    return;
  for (let i = 0; i < 20; i++) {
    x = x + rng()*step;
    if (x > bounds[X][1])
      x = bounds[X][1]
    if (rng() < bends[0] / (bends[0] + bends[1]))
      sides[0] = rng() * bounds[Y][0];
    if (rng() < bends[1] / (bends[0] + bends[1]))
      sides[1] = rng() * bounds[Y][1];
    slices[0].push([x, sides[0]]);
    slices[1].push([x, sides[1]]);
    if (x >= bounds[X][1])
      break;
  }
  slices[0].push([x, sides[0]]);
  slices[1].push([x, sides[1]]);

  let slice: Vec2[] = shape.smoothPoly([...slices[0], ...slices[1].reverse()].map(v => [v[0], v[1] / 2]), 0.1);

  return shape.coveredTowerMesh(slice, curve);
}

function shipGeometry(rng: Rng, id:number) {
  let hullLength = 5 + rng(15)
  let hullWidth = 0.5 + rng();
  let hullHeight = 0.5 + rng();
  let wingWidth = 0.1 + rng()*3;

  let wing1 = generateShipPart(
    rng,
    [rng(3) + 1, rng(3) + 1],
    [[0, hullWidth+1+rng(5)],  [-2 - rng()*hullLength/3, 6 + rng()*hullLength/2]], 
    [[1, 0], [1.5, wingWidth*0.33], [1.5, wingWidth*0.66], [1, wingWidth]]
  )
  let wing2 = shape.clone(wing1);
  shape.reflect(wing2, [1, 0, 0])

  let body = generateShipPart(
    rng,
    [rng(3) + 1, rng(3) + 1],
    [[-3, hullLength], [-4*hullHeight, 4*hullHeight]],
    [[1, -2*hullWidth], [1.5, -1*hullWidth], [1.5, 1*hullWidth], [1, 2*hullWidth]]
  )
  ts(body, m4.axisRotation([0, 0, -1], PIH), m4.axisRotation([0, 1, 0], PIH));

  let ship = shape.combine([body, wing1, wing2])

  for (let v of ship.verts)
    v.type = [SHIP, id, 0, 0];

  return ship;
}

//console.log(2.0101000300*1e7%1e1/1e7);