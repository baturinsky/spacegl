//@ts-check

import { Vec3 } from "./v3";

export type Vec2 = [number, number];
export type Vec4 = [number, number, number, number];
export type Vec = number[];

export const vec4 = (v: Vec, w = 1) => [v[0], v[1], v[2], v.length > 3 ? v[3] : w] as Vec4;
export const vec3 = (v: Vec) => v.length == 3 ? [v[0], v[1], v[2]] : [v[0] / v[3], v[1] / v[3], v[2] / v[3]] as Vec3;
export const len = (v: Vec) => mul(v, v) ** 0.5;
export const dist = <T extends Vec>(v: T, w: T) => len(sub(v,w));
export const scale = <T extends Vec>(v: T, n: number) => v.map(x => x * n) as T;
export const norm = <T extends Vec>(v: T, l = 1) => scale(v, l / len(v)) as T;
export const mul = (v: Vec, w: Vec) => v.reduce((s, x, i) => s + x * w[i], 0);
export const muleach = <T extends Vec>(v: Vec, w: Vec) => v.map((x, i) => x * w[i]) as T;
export const sum = <T extends Vec>(v: T, w: T) => v.map((x, i) => x + w[i]) as T;
export const sum2 = <T extends Vec>(v: T, w: T, n:number) => v.map((x, i) => x + w[i]*n) as T;
export const sub = <T extends Vec>(v: T, w: T) => v.map((x, i) => x - w[i]) as T;
export const sumn = (v: Vec, n: number) => v.map(x => x + n);
export const angle2d = (a: number) => [Math.cos(a), Math.sin(a)] as Vec2;

export const lerp = (v: Vec, w: Vec, n: number) => v.map((x, i) => x * (1 - n) + w[i] * n);

//console.log("l", len([1,2,3]));