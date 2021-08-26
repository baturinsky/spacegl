//@ts-check

import { Vec, Vec2, Vec4 } from "./v3";
import * as v from "./v3";
import * as m from "./m4";
import { arr, dictMap, PI2, X, Y, Z } from "./misc";

export type Vert = { ind: number, at: Vec, norm?: Vec, [key: string]: Vec | Vec4 | number };
export type Face = [Vert, Vert, Vert];
export type Shape = { faces: Face[], verts: Vert[] };
export type Elements = { faces: Uint32Array; verts: { [k: string]: Float32Array; } };

export const defaultAttrs = { at: 3, norm: 3, uv: 3 };

export function calculateFlatNormals(s: Shape) {
  for (let f of s.faces) {
    if (f[2].norm == null || Number.isNaN(f[2].norm[X]))
      f[2].norm = v.norm(v.cross(v.sub(f[1].at, f[2].at), v.sub(f[0].at, f[2].at)));
  }
}

export const transformShape = (mat: m.Mat, shape: Shape) => {
  for (let vert of shape.verts)
    vert.at = m.transform(mat, vert.at);
}

export function combine(shapes: Shape[]) {
  return { faces: flat(shapes.map(s => s.faces)), verts: flat(shapes.map(s => s.verts)) }
}

export function addUp(arr: any[][]) {
  let total = 0;
  return [0, ...arr.map(el => total += el.length)];
}

export function flat(arr: any[][], makeArray: (n: number) => any[] = (n: number) => new Array(n)) {
  const numEl = addUp(arr);
  let flattened = makeArray(numEl[arr.length] + arr[arr.length - 1].length);
  let skip;
  for (let i = arr.length - 1; i >= 0; i--) {
    skip = i == 0 ? 0 : numEl[i];
    for (let j = arr[i].length - 1; j >= 0; j--)
      flattened[skip + j] = arr[i][j];
  }
  return flattened;
}

export function shapesToElements(shapes: Shape[], attrs: { [id: string]: number }) {
  let l = shapes.length;

  let faceCount = addUp(shapes.map(s => s.faces))
  let vertCount = addUp(shapes.map(s => s.verts))

  let faces = new Uint32Array(faceCount[l] * 3);
  let verts = dictMap(attrs, v => new Float32Array(vertCount[l] * v))

  let f = 0;
  shapes.forEach((shape, shapei) => {
    for (let face of shape.faces) {
      const vShift = vertCount[shapei];
      faces[f++] = face[0].ind + vShift;
      faces[f++] = face[1].ind + vShift;
      faces[f++] = face[2].ind + vShift;
    }
  });

  for (let bufName in verts) {
    let size = attrs[bufName];
    let buf = verts[bufName];
    let i = 0;
    if (size == 1)
      shapes.forEach((shape, shapei) => {
        for (let vert of shape.verts)
          if (vert[bufName])
            buf[i++] = vert[bufName] as number;
      });
    else
      shapes.forEach((shape, shapei) => {
        for (let vert of shape.verts) {
          if (vert[bufName])
            buf.set(vert[bufName] as number[], i * size);
          i++
        }
      });
  }

  return { faces, verts } as Elements;
}

export function mesh(cols: number, rows: number, shader: (x: number, y: number) => Vec) {
  let faces: Face[] = new Array(cols * rows * 2), verts: Vert[] = new Array((cols + 1) * (rows + 1));

  let verticeCols = cols + 1;

  for (let x = 0; x <= cols; x++)
    for (let y = 0; y <= rows; y++)
      verts[y * verticeCols + x] = { at: shader(x, y), uv: [x, y, 0], ind: y * verticeCols + x };

  for (let x = 0; x < cols; x++)
    for (let y = 0; y < rows; y++) {
      const fi = 2 * (y * cols + x);
      const vi = y * verticeCols + x;
      faces[fi] = [verts[vi + 1 + verticeCols], verts[vi + verticeCols], verts[vi]];
      faces[fi + 1] = [verts[vi + 1], verts[vi + 1 + verticeCols], verts[vi]];
    }
  return { faces, verts }
}

export const arrToFunc = <T>(arr: T[]) => (n: number) => arr[n]
export const funcToArr = <T>(f: (n: number) => T, l: number) => arr(l).map(i => f(i))

export const revolutionShader = (curve: Vec2[], sectors: number) =>
  towerShader(arr(sectors).map(x => v.angle2d(PI2 / sectors * x)), curve)

export const starShader = (curve: Vec2[], sectors: number, r2: number) =>
  towerShader(arr(sectors).map(x => v.angle2d(PI2 / sectors * x).map(c => c * (x % 2 ? 1 : r2)) as Vec2), curve)

export const biRevolutionShader = (curve: Vec2[], sectors: number, a: number) =>
  towerShader(arr(sectors).map(x => v.angle2d(PI2 / sectors * (x + (x%2?a:0)))), curve)

export const towerShader = (slice: Vec2[], curve: Vec2[]) => (x: number, y: number): Vec => {
  return [slice[x % slice.length][X] * curve[y][X], slice[x % slice.length][Y] * curve[y][X], curve[y][Y]] as Vec;
}

export const pie3 = (r: number, h: number, sectors: number) => mesh(sectors, 3, revolutionShader([[0, 0], [r, 0], [r, h], [0, h]], sectors));

export const generateCurve = (rng: (v?: number) => number) => {
  let [x, y] = [rng() * 2 + 0.5, 0];
  let c = [[0, 0]];
  let w = 2;
  while (rng(5) || c.length == 0) {
    c.push([x, y]);
    if (w <= 1)
      x *= 0.9 - rng() * 0.4;
    if (w >= 1)
      y += (rng() + 0.1) ** 2 * 2 * x;
    w = rng(5);
  }
  c.push([0, y]);
  return c as Vec2[];
}