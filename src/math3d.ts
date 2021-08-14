export type Mat = number[];
export type Vec = [number, number, number];

export const X = 0, Y = 1, Z = 2;
export const axis:Vec[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const arr: (n: number) => number[] = n => [...new Array(n)].map((_, i) => i);

export const mI = arr(16).map(n => n % 5 ? 0 : 1);
export const mMul = (a: Mat, b: Mat) => a.map((_, n) => arr(4).reduce((s, i) => s + a[n - n % 4 + i] * b[n % 4 + i * 4], 0));
export const mAdd = (a: Mat, b: Mat) => a.map((x, i) => x + b[i]) as Mat;
export const mSub = (a: Mat, b: Mat) => a.map((x, i) => x - b[i]) as Mat;
export const mnMul = (m: Mat, n: number) => m.map(x => n * x);
export const mvMul = (m: Mat, v: Vec) => v3(arr(4).map((i) => v4(v).reduce((s, x, j) => s + x * m[j + i*4], 0)));
export const mTrace = a => a[0] + a[5] + a[10] + a[15];
export const mTranslation = (v) => [
  0, 0, 0, v[X],
  0, 0, 0, v[Y],
  0, 0, 0, v[Z],
  0, 0, 0, 1
]

export const mSet = (m, s) => {
  m = [...m];
  for (let k in s)
    m[k] = s[k];
  return m;
}

export const v4 = (v: Vec, w = 1) => [v[0], v[1], v[2], w];
export const v3 = (v: number[]) => [v[0], v[1], v[2]];
export const vLen = (v: Vec) => Math.hypot(v[0], v[1], v[2]);
export const vnMul = (v: Vec, n: number) => [v[0] * n, v[1] * n, v[2] * n] as Vec;
export const vNorm = (v: Vec, len = 1) => vnMul(v, 1 / vLen(v));
export const vMul = (v: Vec, w: Vec) => v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
export const vAdd = (v: Vec, w: Vec) => [v[0] + w[0], v[1] + w[1], v[2] + w[2]] as Vec;
export const vSub = (v: Vec, w: Vec) => [v[0] - w[0], v[1] - w[1], v[2] - w[2]] as Vec;
export const vReflect = (v: Vec, normal: Vec) => vAdd(v, vnMul(normal, vMul(v, normal)))

export const mSum = (a: number, b?: Mat, ...args) =>{
  const v = mnMul(b, a)
  return args.length?mAdd(v,mSum(...(args as [number, Mat, any]))):v;
}

export const mLook = (dir: Vec, up:Vec = axis[Y]) => {
  const z = vNorm(vnMul(dir,-1));
  const x = vCross(z, up);
  const y = vCross(x, z);
  return [
    x[X], x[Y], x[Z], 0,
    y[X], y[Y], y[Z], 0,
    z[X], z[Y], z[Z], 0,
    0, 0, 0, 1
  ]
}

export const mLookAt = (eye:Vec, target: Vec, up:Vec = axis[Y]) => {
  return mLook(vSub(target, eye));
}

export const mPerspective = (fieldOfViewYInRadians: number, aspect: number, zNear: number, zFar: number) => {
  const f = 1 / Math.tan(0.5 * fieldOfViewYInRadians);
  const rangeInv = 1.0 / (zNear - zFar);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (zNear + zFar) * rangeInv, -1,
    0, 0, zNear * zFar * rangeInv * 2, 0
  ]
}

export const mTranspose = (m:Mat) => m.map((_,i)=>m[i%4*4 + ~~(i/4)]);

export function mDet(A: Mat) {
  const AA = mMul(A, A);
  const AAA = mMul(A, AA);
  const AAAA = mMul(AA, AA);
  const trA = mTrace(A);
  const trAA = mTrace(AA);
  const trAAA = mTrace(AAA);
  const trAAAA = mTrace(AAAA);
  const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
  return det;
}

export function mInverse(A: Mat) {
  const AA = mMul(A, A);
  const AAA = mMul(A, AA);
  const AAAA = mMul(AA, AA);
  const trA = mTrace(A);
  const trAA = mTrace(AA);
  const trAAA = mTrace(AAA);
  const trAAAA = mTrace(AAAA);
  const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
  if (!det)
    throw "det=0";
  let sum = mSum((trA * trA * trA - 3 * trA * trAA + 2 * trAAA) / 6, mI,
  - (trA * trA - trAA) / 2, A,
  trA, AA,
  -1, AAA);
  return mnMul( sum, 1 / det);
};

/** Cross multiplication matrix */
export const mCross = (v: Vec) => [
  0, -v[Z], v[Y], 0,
  v[Z], 0, -v[X], 0,
  -v[Y], v[X], 0, 0,
  0, 0, 0, 1
]

/** Vector cross multiplication */
//export const vCross = (v: Vec, w: Vec) => [v[Y]*w[Z] - v[Z]*w[Y], v[Z]*w[X] - v[X]*w[Z], v[X]*w[Y] - v[Y]*w[X]] as Vec;
export const vCross = (v: Vec, w: Vec) => mvMul(mCross(w), v) as Vec;

/** Matrix for rotation around vector by angle a*/
export function mRot(v: Vec, a: number) {
  const K = mCross(v);
  return mSum(1, mI, Math.sin(a), K, 1 - Math.cos(a), mMul(K, K));
}

/*let cm = mCross([2,1,1]);
console.log("cm", cm);
console.log(mvMul(cm, [1,2,2]));*/

export function pie(r, h, sectors) {
  let vertices = [];
  vertices[sectors*2] = [0,0,0];
  vertices[sectors*2+1] = [0,h,0];
  for(let i=0;i<sectors;i++){
    let a = Math.PI*2/sectors*i;
    let x = r*Math.sin(a);
    let z = r*Math.cos(a);
    vertices[i] = [x,0,z];
    vertices[i+sectors] = [x,h,z];        
  }
  let faces = [];
  for(let i=0;i<sectors;i++){
    faces[i*4] = [sectors*2, i, (i+1)%sectors];
    faces[i*4+1] = [sectors*2+1, i+sectors, (i+1)%sectors + sectors];
    faces[i*4+2] = [i, (i+1)%sectors, (i+1)%sectors + sectors];
    faces[i*4+3] = [i, i+sectors, (i+1)%sectors];
  }
  return [vertices, faces];  
}



const test = () => {
  let mat = [
    1, 2, 3, 4,
    5, 6, 7, 1,
    9, 10, 1, 12,
    3, 14, 15, 16
  ]

  //console.log(JSON.stringify(pie(10,10,4)));

  /*console.log(mMul(mat, mI));
  console.log(mMul(mat, mat));
  console.log(mInv(mat));
  console.log('mmul(mat, inv(mat))', mMul(mat, mInv(mat)));*/

  console.log(mTranspose(mat));
}

test()