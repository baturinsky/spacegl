export const X = 0, Y = 1, Z = 2;
export const arr: (n: number) => number[] = n => [...new Array(n)].map((_, i) => i);
export const PI2 = Math.PI * 2;


export function RNG(seed: number) {
  if (0 < seed && seed < 1)
    seed = ~~(seed * 1e9);


  let rngi = (n: number) => {
      return (seed = (seed * 16807) % 2147483647) % n;
    };
    
  /*let rngi = (n: number) => {
    return ~~(Math.sin(++seed) ** 2 * 1e9 % n) * (n<0?-1:1);
  }*/

  let rng = (n?: number) => {
    return n == -1 ? seed : n == null ? rngi(1e9) / 1e9 : rngi(n)
  }
  return rng;
}

export function dictMap<T, S>(a: { [id: string]: T }, f: (t: T, k: string, a: { [id: string]: T }) => S) {
  let res:{ [id: string]: S } = {};
  for (let k in a)
    res[k] = f(a[k], k, a);
  return res;
}