//@ts-check

export type Vec2 = [number, number];
export type Vec4 = [number, number, number, number];
export type Vec = number[];

export const v4 = (v: Vec, w = 1) => [v[0], v[1], v[2], v.length > 3 ? v[3] : w] as Vec4;
export const v3 = (v: Vec) => v.length == 3 ? [v[0], v[1], v[2]] : [v[0] / v[3], v[1] / v[3], v[2] / v[3]];
export const len = (v: Vec) => mul(v, v) ** 0.5;
export const scale = (v: Vec, n: number) => v.map(x => x * n) as Vec;
export const norm = (v: Vec, l = 1) => scale(v, l / len(v));
export const mul = (v: Vec, w: Vec) => v.reduce((s, x, i) => s + x * w[i], 0);
export const sum = (v: Vec, w: Vec) => v.map((x, i) => x + w[i]);
export const sub = (v: Vec, w: Vec) => v.map((x, i) => x - w[i]);
export const sumn = (v: Vec, n: number) => v.map(x => x + n);
export const angle2d = (a: number) => [Math.cos(a), Math.sin(a)] as [number, number]

export const lerp = (v: Vec, w: Vec, n: number) => v.map((x, i) => x * (1 - n) + w[i] * n);

//console.log("l", len([1,2,3]));