//@ts-check

import { Vec3 } from "./v3";
import * as v3 from "./v3";
import * as vec from "./v";
import * as m4 from "./m4";
import { range, rangef as rangef, dictMap, PI2, X, Y, Z, PIH } from "./misc";
import { angle2d, Vec, Vec2, Vec4 } from "./v";
import * as gc from "./glconst";

export const ATTRSIZE = 0, ATTRTYPE = 1;

export type Vert = { ind: number, at: Vec3, norm?: Vec3, cell?: Vec, shape?: number, type?: Vec4, [key: string]: Vec | number };
export type Face = [Vert, Vert, Vert];
export type Shape = { faces: Face[], verts: Vert[], common?: {[key: string]: number[] | number} };
export type Elements = { faces: Uint32Array; verts: { [k: string]: Float32Array | Int32Array; } };

export const defaultAttrs = { at: [3], norm: [3], cell: [3] };

export function calculateFlatNormals(s: Shape) {
  for (let f of s.faces) {
    if (f[2].norm == null || Number.isNaN(f[2].norm[X]))
      f[2].norm = v3.norm(v3.cross(v3.sub(f[0].at, f[2].at), v3.sub(f[1].at, f[2].at)));
  }
}

export const transformShape = (shape: Shape, ...mats: m4.Mat[]) => {
  let combined = m4.combine(...mats);
  for (let vert of shape.verts)
    vert.at = m4.transform(combined, vert.at);
}

export function reindexVerts(shape: Shape) {
  shape.verts.forEach((v, i) => v.ind = i)
  return shape;
}

export function combine(shapes: Shape[]) {
  return reindexVerts({ faces: flat(shapes.map(s => s.faces)), verts: flat(shapes.map(s => s.verts)) })
}

export function addUp(arr: any[][]) {
  let total = 0;
  return [0, ...arr.map(el => total += el.length)];
}

export function flat(arr: any[][], makeArray: (n: number) => any[] = (n: number) => new Array(n)) {
  const numEl = addUp(arr);
  let flattened = makeArray(numEl[arr.length]);
  let skip;
  for (let i = arr.length - 1; i >= 0; i--) {
    skip = i == 0 ? 0 : numEl[i];
    for (let j = arr[i].length - 1; j >= 0; j--)
      flattened[skip + j] = arr[i][j];
  }
  return flattened;
}

export function shapesToElements(shapes: Shape[], attrs: { [id: string]: number[] }) {
  let l = shapes.length;

  let faceCount = addUp(shapes.map(s => s.faces))
  let vertCount = addUp(shapes.map(s => s.verts))

  let faceBuf = new Uint32Array(faceCount[l] * 3);
  let vertBufs = dictMap(attrs, v => {
    if (v[ATTRTYPE] && v[ATTRTYPE] != gc.FLOAT) {
      return new Int32Array(vertCount[l] * v[ATTRSIZE])
    } else {
      return new Float32Array(vertCount[l] * v[ATTRSIZE])
    }
  })

  let f = 0;
  shapes.forEach((shape, shapei) => {
    for (let face of shape.faces) {
      const vShift = vertCount[shapei];
      faceBuf[f++] = face[0].ind + vShift;
      faceBuf[f++] = face[1].ind + vShift;
      faceBuf[f++] = face[2].ind + vShift;
    }
  });

  for (let bufName in vertBufs) {
    let size = attrs[bufName][ATTRSIZE];
    let buf = vertBufs[bufName];
    let i = 0;
    for (let shape of shapes) {
      let base = shape.common?shape.common[bufName]:null;
      for (let vert of shape.verts) {
        let value = vert[bufName] || base;
        if (value)
          if (size == 1)
            buf[i] = value as number;
          else
            buf.set(value as number[], i * size);
        i++;
      }
    }
  }

  return { faces: faceBuf, verts: vertBufs } as Elements;
}

export function mesha(rows: number, arr: Vec3[]) {
  return mesh(arr.length / rows, rows, (x: number, y: number) => arr[x + y * rows])
}

export function mesh(cols: number, rows: number, shader: (x: number, y: number) => Vec3) {
  let faces: Face[] = new Array(cols * rows * 2), verts: Vert[] = new Array((cols + 1) * (rows + 1));

  let verticeCols = cols + 1;

  for (let x = 0; x <= cols; x++)
    for (let y = 0; y <= rows; y++)
      verts[y * verticeCols + x] = { at: shader(x, y), cell: [x, y, 0], ind: y * verticeCols + x };

  for (let x = 0; x < cols; x++)
    for (let y = 0; y < rows; y++) {
      const fi = 2 * (y * cols + x);
      const vi = y * verticeCols + x;
      faces[fi] = [verts[vi + 1 + verticeCols], verts[vi + verticeCols], verts[vi]];
      faces[fi + 1] = [verts[vi + 1], verts[vi + 1 + verticeCols], verts[vi]];
    }
  return { faces, verts } as Shape;
}

export const arrToFunc = <T>(arr: T[]) => (n: number) => arr[n]
export const funcToArr = <T>(f: (n: number) => T, l: number) => range(l).map(i => f(i))

export const revolutionShader = (sectors: number, angle: number = 0) =>
  (x: number) => angle2d(PI2 / sectors * x + angle);

export const starShader = (sectors: number, r2: number) =>
  (x: number) => angle2d(PI2 / sectors * x).map(c => c * (x % 2 ? 1 : r2));

export const biRevolutionShader = (sectors: number, a: number) =>
  (x: number) => angle2d(PI2 / sectors * (x + (x % 2 ? a : 0)))

export const towerShader = (slice: Vec2[], curve: Vec2[]) => (x: number, y: number): Vec3 => {
  return [
    slice[x % slice.length][X] * curve[y][X],
    slice[x % slice.length][Y] * curve[y][X],
    curve[y][Y]
  ] as Vec3;
}

export const towerXShader = (slice: Vec2[], curve: Vec2[]) => (x: number, y: number): Vec3 => {
  return [
    slice[x % slice.length][X] * curve[y][X],
    slice[x % slice.length][Y],
    curve[y][Y]
  ] as Vec3;
}

export const towerMesh = (slice: Vec2[], curve: Vec2[]) => twoCurvesMesh(slice, curve, towerShader);

export const coveredTowerMesh = (slice: Vec2[], curve: Vec2[]) => {
  let bottom = curve[0][Y], top = curve[curve.length - 1][Y]
  const side = (h: number) => mesh(slice.length / 2, 1, (x, y) => [...slice[y == 0 ? x : slice.length - x - 1], h]);
  let side1 = side(bottom);
  let side2 = side(top);
  invert(side1);

  let part = towerMesh(slice, curve);

  return combine([part, side1, side2]);
}

export const twoCurvesMesh = (
  slice: Vec2[],
  curve: Vec2[],
  shader: (slice: Vec2[], curve: Vec2[]) => (x: number, y: number) => Vec3
) => mesh(slice.length, curve.length - 1, shader(slice, curve))

export const smoothPoly = (curve: Vec[], gap: number) => flat(curve.map((v, i) => {
  let w = curve[(i + 1) % curve.length];
  return [vec.lerp(v, w, gap), vec.lerp(v, w, 1 - gap)] as Vec2[]
}))

export const smoothPolyFixed = (curve: Vec[], gap: number) => flat(curve.map((v, i) => {
  let w = curve[(i + 1) % curve.length];
  let d = vec.dist(v, w);
  let g = gap / d;
  return [vec.lerp(v, w, g), vec.lerp(v, w, 1 - g)]
}))


export const pie3 = (r: number, h: number, sectors: number) =>
  towerShader([[0, 0], [r, 0], [r, h], [0, h]], rangef(sectors, revolutionShader(sectors)));

export const circle = (divs: number) => rangef(divs, i => angle2d(i / (divs - 1) * PI2));

export function clone(shape: Shape) {
  let s2 = { ...shape };
  s2.verts = JSON.parse(JSON.stringify(shape.verts));
  s2.faces = shape.faces.map(f => f.map(v => s2.verts[v.ind])) as Face[];
  return s2;
}

export function invert(shape: Shape) {
  shape.faces = shape.faces.map(f => [f[1], f[0], f[2]]);
}

export function reflect(shape: Shape, norm: Vec3) {
  transformShape(shape, m4.reflection(norm));
  invert(shape);
}

export function set(s: Shape, field: string, f: (v: Vert) => any) {
  for (let v of s.verts)
    v[field] = f(v);
}

export function setIfNull(s: Shape, field: string, f: (v: Vert) => any) {
  for (let v of s.verts)
    if (v[field] == null)
      v[field] = f(v);
}

export function triangle(verts: Vert[]) {
  return { faces: [verts], verts } as Shape;
}

export function quad(verts: Vert[]) {
  return { faces: [[verts[1], verts[2], verts[3]], [verts[0], verts[1], verts[3]]], verts } as Shape;
}

export function vertsAt(coords: Vec3[]) {
  return coords.map((at, ind) => ({ ind, at })) as Vert[];
}