//@ts-check

export type Mat = number[];
import * as v3 from "./v3"
import { Vec3 } from "./v3"
import { arr, X, Y, Z } from "./misc"

const UP = v3.axis[Y];

export const identity = arr(16).map(i => i % 5 ? 0 : 1);

export const multiply = (a: Mat, b: Mat) => a.map((_, n) => {
  let col = n % 4, row4 = n - col;
  return (
    b[row4] * a[col] +
    b[row4 + 1] * a[col + 4] +
    b[row4 + 2] * a[col + 8] +
    b[row4 + 3] * a[col + 12]
  )
});
export const sum = (a: Mat, b: Mat) => a.map((x, i) => x + b[i]) as Mat;
export const sub = (a: Mat, b: Mat) => a.map((x, i) => x - b[i]) as Mat;
export const scale = (m: Mat, n: number) => m.map(x => n * x);
export const trace = (a: Mat) => a[0] + a[5] + a[10] + a[15];

export const sumScale = (a: number, b?: Mat, ...args: any[]): Mat => {
  const v = scale(b, a)
  return (args.length ? sum(v, sumScale(...(args as [number, Mat, any]))) : v) as Mat;
}

export const transpose = (m: Mat) => m.map((_, i) => m[i % 4 * 4 + ~~(i / 4)]);

export function matInfo(A: Mat): [number, Mat, Mat, number, number, number,] {
  const AA = multiply(A, A);
  const AAA = multiply(A, AA);
  const AAAA = multiply(AA, AA);
  const trA = trace(A);
  const trAA = trace(AA);
  const trAAA = trace(AAA);
  const trAAAA = trace(AAAA);
  const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
  return [det, AA, AAA, trA, trAA, trAAA];
}


export function det(A: Mat) {
  return matInfo(A)[0];
}

export function inverse(A: Mat) {
  let [det, AA, AAA, trA, trAA, trAAA] = matInfo(A);
  let total = sumScale(
    (trA * trA * trA - 3 * trA * trAA + 2 * trAAA) / 6, identity,
    - (trA * trA - trAA) / 2, A,
    trA, AA,
    -1, AAA
  );
  return scale(total, 1 / det);
};

export const set = (m: Mat, s: { [k: number]: number }) => {
  m = [...m];
  for (let k in s)
    m[k] = s[k];
  return m;
}

export const cross = (v: Vec3) => [
  0, -v[Z], v[Y], 0,
  v[Z], 0, -v[X], 0,
  -v[Y], v[X], 0, 0,
  0, 0, 0, 1
]

export const lookTo = (eye: Vec3, dir: Vec3, up: Vec3 = UP) => {
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

export const lookAt = (eye: Vec3, target: Vec3, up: Vec3 = UP) => {
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

export function axisRotation(axis: Vec3, angleInRadians: number) {

  let [x, y, z] = axis;
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;

  return [
    x * x + (1 - x * x) * c, x * y * oneMinusCosine + z * s, x * z * oneMinusCosine - y * s, 0,
    x * y * oneMinusCosine - z * s, y * y + (1 - y * y) * c, y * z * oneMinusCosine + x * s, 0,
    x * z * oneMinusCosine + y * s, y * z * oneMinusCosine - x * s, z * z + (1 - z * z) * c, 0,
    0, 0, 0, 1
  ]
}

export function transformDirection(m: Mat, v: Vec3) {

  const [v0, v1, v2] = v;

  return [
    v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0],
    v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1],
    v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2]
  ];
}

export function transform(m: Mat, v: Vec3) {
  const [v0, v1, v2] = v;
  const d = v0 * m[3] + v1 * m[7] + v2 * m[11] + m[15];

  return [
    (v0 * m[0] + v1 * m[4] + v2 * m[8] + m[12]) / d,
    (v0 * m[1] + v1 * m[5] + v2 * m[9] + m[13]) / d,
    (v0 * m[2] + v1 * m[6] + v2 * m[10] + m[14]) / d
  ] as Vec3;
}

export const scaling = (n: number) => arr(16).map(i => i==15?1:i % 5 ? 0 : n);

export const translation = (v: Vec3) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  v[X], v[Y], v[Z], 1
]

export const shortMultiply = (a: Mat, b: Mat) => a.map((_, n) => arr(4).reduce((s, i) => s + b[n - n % 4 + i] * a[n % 4 + i * 4], 0));


export function camera(at:Vec3, dir:Vec3, [width, height]:[number, number]){
  const fov = (50 * Math.PI) / 180;
  const aspect = width / height;
  const zNear = 5;
  const zFar = 2000;
  const look = lookAt(at, v3.sum(at,dir), v3.axis[Z]);
  
  const mPerspective = perspective(fov, aspect, zNear, zFar);
  const mCamera = multiply(mPerspective, inverse(look));  
  return mCamera;
}
