//@ts-check

import {X, Y, Z} from "./misc"

export type Vec2 = [number, number];
export type Vec = [number, number, number];
export type Vec4 = [number, number, number, number];

export const axis: Vec[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const v4 = (v: Vec | Vec4, w = 1) => [v[0], v[1], v[2], v.length > 3 ? v[3] : w] as Vec4;
export const v3 = (v: Vec | Vec4) => v.length==3?[v[0], v[1], v[2]]:[v[0]/v[3], v[1]/v[3], v[2]/v[3]];
//export const len = (v: Vec) => Math.hypot(v[0], v[1], v[2]);
export const len = (v: Vec) => (v[0]*v[0] + v[1]*v[1] + v[2]*v[2])**0.5;
export const scale = (v: Vec, n: number) => [v[0] * n, v[1] * n, v[2] * n] as Vec;
export const norm = (v: Vec, l = 1) => scale(v, l / len(v));
export const mul = (v: Vec, w: Vec) => v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
export const add = (v: Vec, w: Vec) => [v[0] + w[0], v[1] + w[1], v[2] + w[2]] as Vec;
export const addn = (v: Vec, n: number) => [v[0] + n, v[1] + n, v[2] + n] as Vec;
export const sub = (v: Vec, w: Vec) => [v[0] - w[0], v[1] - w[1], v[2] - w[2]] as Vec;
export const reflect = (v: Vec, normal: Vec) => add(v, scale(normal, mul(v, normal)))
export const cross = (a: Vec, b: Vec) => [a[Y]*b[Z] - a[Z]*b[Y], a[Z]*b[X] - a[X]*b[Z], a[X]*b[Y] - a[Y]*b[X]] as Vec;
export const angle2d = (a:number) => [Math.cos(a), Math.sin(a)] as [number, number]

//console.log("l", len([1,2,3]));