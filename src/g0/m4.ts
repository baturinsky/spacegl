export type Mat = number[];
import * as v3 from "./v3"
import { Vec } from "./v3"
import { arr, X, Y, Z, Shape } from "./misc"

const UP = v3.axis[Y];

export const transform = (m: Mat, v: v3.Vec | v3.Vec4) => {
  v = v3.v4(v);
  return arr(3).map((col) => v.reduce((sum, x, row) => sum + x * m[row + col*4], 0)) as Vec;
};

export const transformShape = (m: Mat, shape: Shape) => ({ ...shape, vert: shape.vert.map(v => transform(m, v)) } as Shape);

export const multiply = (a: Mat, b: Mat) => a.map((_, n) => arr(4).reduce((s, i) => s + b[n - n % 4 + i] * a[n % 4 + i * 4], 0));
export const add = (a: Mat, b: Mat) => a.map((x, i) => x + b[i]) as Mat;
export const sub = (a: Mat, b: Mat) => a.map((x, i) => x - b[i]) as Mat;
export const scale = (m: Mat, n: number) => m.map(x => n * x);
export const trace = a => a[0] + a[5] + a[10] + a[15];

export const sum = (a: number, b?: Mat, ...args) => {
  const v = scale(b, a)
  return args.length ? add(v, sum(...(args as [number, Mat, any]))) : v;
}

export const transpose = (m: Mat) => m.map((_, i) => m[i % 4 * 4 + ~~(i / 4)]);

export function det(A: Mat) {
  const AA = multiply(A, A);
  const AAA = multiply(A, AA);
  const AAAA = multiply(AA, AA);
  const trA = trace(A);
  const trAA = trace(AA);
  const trAAA = trace(AAA);
  const trAAAA = trace(AAAA);
  const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
  return det;
}

export function inverse(A: Mat) {
  const AA = multiply(A, A);
  const AAA = multiply(A, AA);
  const AAAA = multiply(AA, AA);
  const trA = trace(A);
  const trAA = trace(AA);
  const trAAA = trace(AAA);
  const trAAAA = trace(AAAA);
  const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
  let total = sum((trA * trA * trA - 3 * trA * trAA + 2 * trAAA) / 6, identity,
    - (trA * trA - trAA) / 2, A,
    trA, AA,
    -1, AAA);
  return scale(total, 1 / det);
};

export const identity = arr(16).map(n => n % 5 ? 0 : 1);

export const set = (m, s) => {
  m = [...m];
  for (let k in s)
    m[k] = s[k];
  return m;
}

export const cross = (v: Vec) => [
  0, -v[Z], v[Y], 0,
  v[Z], 0, -v[X], 0,
  -v[Y], v[X], 0, 0,
  0, 0, 0, 1
]

export const lookTo = (eye: Vec, dir: Vec, up: Vec = UP) => {
  const z = v3.norm(v3.scale(dir, -1));
  const x = v3.norm(v3.cross(up, z));
  const y = v3.cross(x, z);
  return [
    x[X], x[Y], x[Z], 0,
    y[X], y[Y], y[Z], 0,
    z[X], z[Y], z[Z], 0,
    eye[X], eye[Y], eye[Z], 1
  ]
}

export const lookAt = (eye: Vec, target: Vec, up: Vec = UP) => {
  return lookTo(eye, v3.sub(target, eye), up);
}

export const perspective = (fieldOfViewYInRadians: number, aspect: number, zNear: number, zFar: number) => {
  const f = 1 / Math.tan(0.5 * fieldOfViewYInRadians);
  const rangeInv = 1.0 / (zNear - zFar);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (zNear + zFar) * rangeInv, -1,
    0, 0, zNear * zFar * rangeInv * 2, 0
  ]
}

export function rotation(v: Vec, a: number) {
  const K = cross(v);
  return sum(1, identity, Math.sin(a), K, 1 - Math.cos(a), multiply(K, K));
}

export const translation = (v:Vec) => [
  1, 0, 0, v[X],
  0, 1, 0, v[Y],
  0, 0, 1, v[Z],
  0, 0, 0, 1
]
