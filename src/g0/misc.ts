import { angle2d, v3, Vec, addn } from "./v3";

export const X = 0, Y = 1, Z = 2;
export const arr: (n: number) => number[] = n => [...new Array(n)].map((_, i) => i);
export const VERT = 0, FACE = 1, NORM = 2;

export type Shape = [Vec[], Vec[], Vec[]]

export function pie(r: number, h: number, sectors: number) {
  let vert: Vec[] = [], norm: Vec[] = [], face: Vec[] = [];
  const bottom = sectors * 2, top = sectors * 2 + 1;
  vert[bottom] = [0, 0, 0];
  norm[bottom] = [0, 0, -1];

  vert[top] = [0, 0, h];
  norm[top] = [0, 0, 1];

  const angleStep = Math.PI * 2 / sectors;

  for (let i = 0; i < sectors; i++) {
    let a = angle2d(angleStep * i)
    let an = angle2d(angleStep * (i + 0.5))
    let x = r * a[X];
    let y = r * a[Y];
    vert[i] = [x, y, 0];
    vert[i + sectors] = [x, y, h];
    norm[i] = norm[i + sectors] = [an[X], an[Y], 0]
  }
  for (let i = 0; i < sectors; i++) {
    let j = (i + 1) % sectors;
    face[i * 4] = [i, j, bottom]; //bottom
    face[i * 4 + 1] = [i + sectors, j + sectors, top]; //top
    face[i * 4 + 2] = [j, j + sectors, i];
    face[i * 4 + 3] = [i + sectors, j + sectors, i];
  }
  return [vert, face, norm] as Shape;
}

export function combine(shapes: Shape[]) {
  let total = 0;
  return [
    flat(shapes.map(shape => shape[VERT])),
    flat(shapes.map(shape => {
      let r = shape[FACE].map(f => addn(f, total));
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
  let count = new Array(l+1);
  count[0] = [0, 0, 0];
  for (let i = 0; i < l; i++) {
    count[i+1] = count[i].map((v, j) => v + shapes[i][j].length)
  }
  let bufs = [new Float32Array(count[l][VERT] * 3), new Uint32Array(count[l][FACE] * 3), new Float32Array(count[l][NORM] * 3)]
  shapes.forEach((shape, shapei) => {
    for (let layer of [VERT, FACE, NORM]) {
      shape[layer].forEach((el, i) => {
        if(layer == FACE)
          el = addn(el, count[shapei][VERT]);
        bufs[layer].set(el, (count[shapei][layer] + i) * 3)
      });
    }
  })
  //debugger;
  return bufs;
}