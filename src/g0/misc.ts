//@ts-check

import { Vec, Vec4 } from "./v3";
import * as v from "./v3";

export const X = 0, Y = 1, Z = 2;
export const arr: (n: number) => number[] = n => [...new Array(n)].map((_, i) => i);
export const FACE = 0, VERT = 1, NORM = 2, ETC = 3, GEOCHANNELS = [0, 1, 2, 3];

export type Shape = [Vec[], Vec[], Vec[]?, Vec4[]?]
export const PI2 = Math.PI * 2;

const rng = Math.random

export function calculateNormals(s: Shape) {
  s[NORM] = new Array(s[VERT].length);
  for (let i = 0; i < s[FACE].length; i++) {
    let verts = s[FACE][i].map(v => s[VERT][v]);
    s[NORM][s[FACE][i][2]] = v.norm(v.cross(v.sub(verts[1], verts[0]), v.sub(verts[2], verts[0])));
  }
}

export function pie(r: number, h: number, sectors: number) {
  let vert: Vec[] = [], face: Vec[] = [], etc: Vec4[] = [];
  const foundation = 0, roof = 1, upper = sectors + 1;

  vert[foundation] = [0, 0, 0];
  vert[roof] = [0, 0, h];

  etc[foundation] = [0, -1, 0, 0];
  etc[roof] = [0, 2, 0, 0];

  const angleStep = Math.PI * 2 / sectors;

  for (let i = 2; i < sectors + 3; i++) {
    let a = v.angle2d(angleStep * (i - 2))
    let x = r * a[X];
    let y = r * a[Y];
    vert[i] = [x, y, 0];
    vert[i + upper] = [x, y, h];

    etc[i] = [i, 0, 0, 0];
    etc[i + upper] = [i, 1, 0, 0];
  }

  for (let i = 0; i < sectors + 1; i++) {
    let left = i + 2
    let right = (i + 1) % upper + 2;
    face[i * 4] = [right, left, foundation]; //bottom
    face[i * 4 + 1] = [left + upper, right + upper, roof]; //top
    face[i * 4 + 2] = [right, right + upper, left];
    face[i * 4 + 3] = [right + upper, left + upper, left];
  }

  return [face, vert, null, etc] as Shape;
}

export function combine(shapes: Shape[]) {
  let total = 0;
  return [
    flat(shapes.map(shape => shape[VERT])),
    flat(shapes.map(shape => {
      let r = shape[FACE].map(f => v.addn(f, total));
      total += shape[VERT].length;
      return r;
    })),
    flat(shapes.map(shape => shape[NORM])),
  ] as Shape;
}

export function flat1(arr) { return [].concat(...arr) }

export function flat2(arr) {
  let flattened = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      flattened.push(arr[i][j])
    }
  }
  return flattened;
}

export function numElementsUptoIndex(arr: any[]) {
  let r = Array(arr.length);
  r[0] = 0;
  for (let i = 1; i < arr.length; i++)
    r[i] = r[i - 1] + arr[i - 1].length;
  return r;
}

export function numElementsUptoIndexS(arr: any[][]) {
  let total = 0;
  return [0, ...arr.map((el, i) => total += el.length)];
}

export function flat(arr, makeArray: Function = n => new Array(n)) {
  const numEl = numElementsUptoIndex(arr);
  let flattened = makeArray(numEl[arr.length - 1] + arr[arr.length - 1].length);
  let skip;
  for (let i = arr.length - 1; i >= 0; i--) {
    skip = numEl[i];
    for (let j = arr[i].length - 1; j >= 0; j--)
      flattened[skip + j] = arr[i][j];
  }
  return flattened;
}

export function shapesToBuffers(shapes: Shape[]) {

  let l = shapes.length;
  let count = new Array(l + 1);
  count[0] = [0, 0];
  for (let i = 0; i < l; i++) {
    count[i + 1] = count[i].map((v, j) => v + shapes[i][j].length)
  }
  let bufs = [
    new Uint32Array(count[l][FACE] * 3),
    new Float32Array(count[l][VERT] * 3),
    new Float32Array(count[l][VERT] * 3),
    new Float32Array(count[l][VERT] * 4),
  ]

  shapes.forEach((shape, shapei) => {
    for (let slayer in shape) {
      let layer = ~~slayer;
      shape[layer].forEach((el, i) => {
        if (layer == FACE)
          el = v.addn(el, count[shapei][VERT]);
        bufs[layer].set(el, (count[shapei][layer == FACE ? FACE : VERT] + i) * (layer == ETC ? 4 : 3))
      });
    }
  })
  //debugger;
  return bufs;
}

export function mesh(w: number, h: number, shader: (x: number, y: number) => Vec) {
  let face: Vec[] = [], vert: Vec[] = [], etc: Vec4[] = [];

  let cols = w + 1;

  for (let x = 0; x <= w; x++) {
    for (let y = 0; y <= h; y++) {
      let vi = y * cols + x;
      vert[vi] = shader(x, y);
      etc[vi] = [x, y, 0, 0];
      if (x < w && y < h) {
        const fi = 2 * (y * w + x);
        face[fi] = [vi + 1 + cols, vi + cols, vi];
        face[fi+1] = [vi + 1, vi + 1 + cols, vi];
      }
    }
  }

  return [face, vert, null, etc] as Shape;
}

export const pieShader = (r: number, h: number, sectors: number) => (x: number, y: number): Vec => {
  if (y == 0)
    return [0, 0, 0];
  if (y == 3)
    return [0, 0, h];
  let a = v.angle2d(PI2 / sectors * x);
  return [a[X] * r, a[Y] * r, (y - 1) * h] as Vec;
}

export const pie2 = (r, h, sectors) => mesh(sectors, 3, pieShader(r, h, sectors));


export const revolutionShader = (curve: number[][], sectors: number) => (x: number, y: number): Vec => {
  let a = v.angle2d(PI2 / sectors * x);
  return [a[X] * curve[y][X], a[Y] * curve[y][X], curve[y][Y]] as Vec;
}

export const pie3 = (r, h, sectors) => mesh(sectors, 3, revolutionShader([[0, 0], [r, 0], [r, h], [0, h]], sectors));

export const generateCurve = () => {
  let [x, y] = [rng() * 2, 0];
  let c = [[0, 0]];
  let w = 0;
  while (rng() > 0.2 || c.length == 0) {
    c.push([x, y]);
    if (w != 0)
      x *= 0.9 - rng() * 0.3;
    if (w != 1)
      y += rng() ** 2 * 2 * x;
    w = ~~(rng() * 3);
  }
  c.push([0, y]);
  return c;
}

for (let i of arr(10))
  console.log(generateCurve());