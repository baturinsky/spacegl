export const X = 0, Y = 1, Z = 2;
export const range = (n: number) => [...new Array(n)].map((_, i) => i);
export const rangef = <T>(n: number, f: (n: number) => T) => [...new Array(n)].map((_, i) => f ? f(i) : i) as T[];
export const PI2 = Math.PI * 2, PI = Math.PI, PIH = Math.PI / 2, PIQ = Math.PI / 4;


const maxN = 2**31;

export type Rng = (n?: number) => number;

export function RNG(seed: number) {
  if (0 < seed && seed < 1)
    seed = ~~(seed * maxN);

  let rngi = (n: number) => {
    return (seed = (seed * 16807) % 2147483647) % n;
  };

  /*let rngi = (n: number) => {
    return ~~(Math.sin(++seed) ** 2 * 1e9 % n) * (n<0?-1:1);
  }*/

  let rng = (n?: number) => {
    return n == -1 ? seed : n == null ? rngi(maxN) / maxN : rngi(n)
  }
  return rng;
}

export function dictMap<T, S>(a: { [id: string]: T }, f: (t: T, k: string, a: { [id: string]: T }) => S) {
  let res: { [id: string]: S } = {};
  for (let k in a)
    res[k] = f(a[k], k, a);
  return res;
}

export function hexDigit(n: number, place: number) {
  return n >> (place * 4) % 16;
}

export function hex2Digit(n: number, place: number) {
  return n >> (place * 4) % 256;
}

export function hexFromDigits(n:number[]){
  return n.reduce((t,v)=>t*16+v)
}