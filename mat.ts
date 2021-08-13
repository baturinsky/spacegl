{
type Mat = number[];

const arr: (number) => number[] = n => n ? [...arr(n - 1), n - 1] : [];
const mmul = (a: Mat, b: Mat) => a.map((_, n) => arr(4).reduce((m, i) => {/*console.log(i, n - n % 4 + i, n % 4 + i * 4);*/  return m + a[n - n % 4 + i] * b[n % 4 + i * 4] }, 0
));
const madd = (a: Mat, b: Mat) => a.map((v, i) => v + b[i]);
const msub = (a: Mat, b: Mat) => a.map((v, i) => v - b[i]);
const mscale = (a: Mat, x: number) => a.map(v => v * x);

const msum = (a: Mat | Number, b?: Mat | Number, ...args) =>
  b ?
    a === +a ? // a is number
      msum(mscale(b as Mat, a as number), ...args) :
      madd(a as Mat, msum(b, ...args))
    : a;

const mI = arr(16).map(n => n % 5 ? 0 : 1);
const tr = a => a[0] + a[5] + a[10] + a[15];

const inv = A => {
  const AA = mmul(A, A);
  const AAA = mmul(A, AA);
  const AAAA = mmul(AA, AA);
  const trA = tr(A);
  const trAA = tr(AA);
  const trAAA = tr(AAA);
  const trAAAA = tr(AAAA);
  const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
  if (!det) {
    return;
  }
  return mscale(
    msum(
      (trA ** 3 - 3 * trA * trAA + 2 * trAAA) / 6, mI,
      - (trA ** 2 - trAA) / 2, A,
      trA, AA,
      -1, AAA
    ),
    1 / det);
};

const mat = arr(16);
console.log(mmul(mat, inv(mat)));
}