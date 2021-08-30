//@ts-check

import { Vec3 } from "./v3";
import * as v3 from "./v3";
import * as vec from "./v";
import * as m4 from "./m4";
import { arr, arrm as arrm, dictMap, PI2, X, Y, Z } from "./misc";
import { angle2d, Vec, Vec2, Vec4 } from "./v";

export type Vert = { ind: number, at: Vec3, norm?: Vec3, cell?: Vec, shape?: number, type?: number, [key: string]: Vec | number };
export type Face = [Vert, Vert, Vert];
export type Shape = { faces: Face[], verts: Vert[] };
export type Elements = { faces: Uint32Array; verts: { [k: string]: Float32Array; } };

export const defaultAttrs = { at: 3, norm: 3, cell: 3 };

export function calculateFlatNormals(s: Shape) {
  for (let f of s.faces) {
    if (f[2].norm == null || Number.isNaN(f[2].norm[X]))
      f[2].norm = v3.norm(v3.cross(v3.sub(f[1].at, f[2].at), v3.sub(f[0].at, f[2].at)));
  }
}

export const transformShape = (shape: Shape, ...mats: m4.Mat[]) => {
  for (let mat of mats)
    for (let vert of shape.verts)
      vert.at = m4.transform(mat, vert.at);
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
    if (size == 1) {
      for (let shape of shapes) {
        for (let vert of shape.verts) {
          if (vert[bufName])
            buf[i] = vert[bufName] as number;
          i++;
        }
      }
    } else {
      for (let shape of shapes) {
        for (let vert of shape.verts) {
          if (vert[bufName])
            buf.set(vert[bufName] as number[], i * size);
          i++
        }
      };
    }
  }

  return { faces, verts } as Elements;
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
  return { faces, verts }
}

export const arrToFunc = <T>(arr: T[]) => (n: number) => arr[n]
export const funcToArr = <T>(f: (n: number) => T, l: number) => arr(l).map(i => f(i))

export const revolutionShader = (sectors: number) =>
  (x: number) => angle2d(PI2 / sectors * x);

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

export const towerMesh = (slice: Vec2[], curve: Vec2[]) => mesh(slice.length, curve.length - 1, towerShader(slice, curve))

export const smoothPoly = (curve: Vec[], gap: number) => flat(curve.map((v, i) => {
  let w = curve[(i + 1) % curve.length];
  return [vec.lerp(v, w, gap), vec.lerp(v, w, 1 - gap)]
}))

export const pie3 = (r: number, h: number, sectors: number) =>
  towerShader([[0, 0], [r, 0], [r, h], [0, h]], arrm(sectors, revolutionShader(sectors)));
