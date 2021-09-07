//@ts-check

import { X, Y, Z } from "./misc"

export type Vec3 = [number, number, number];

export const axis: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const len = (v: Vec3) => (v[X] * v[X] + v[Y] * v[Y] + v[Z] * v[Z]) ** 0.5;
export const scale = (v: Vec3, n: number) => [v[X] * n, v[Y] * n, v[Z] * n] as Vec3;
export const norm = (v: Vec3, l = 1) => scale(v, l / len(v));
export const mul = (v: Vec3, w: Vec3) => v[X] * w[X] + v[Y] * w[Y] + v[Z] * w[Z];
export const sum = (v: Vec3, w: Vec3) => [v[X] + w[X], v[Y] + w[Y], v[Z] + w[Z]] as Vec3;
export const mulEach = (v: Vec3, w: Vec3) => [v[X] * w[X], v[Y] * w[Y], v[Z] * w[Z]] as Vec3;
export const sumn = (v: Vec3, n: number) => [v[X] + n, v[Y] + n, v[Z] + n] as Vec3;
export const sub = (v: Vec3, w: Vec3) => [v[X] - w[X], v[Y] - w[Y], v[Z] - w[Z]] as Vec3;
export const reflect = (v: Vec3, normal: Vec3) => sum(v, scale(normal, mul(v, normal)))
export const cross = (a: Vec3, b: Vec3) => [a[Y] * b[Z] - a[Z] * b[Y], a[Z] * b[X] - a[X] * b[Z], a[X] * b[Y] - a[Y] * b[X]] as Vec3;

export const lerp = (v: Vec3, w: Vec3, n: number) => [
  v[X] * (1 - n) + w[X] * n, 
  v[Y] * (1 - n) + w[Y] * n, 
  v[Z] * (1 - n) + w[Z] * n
] as Vec3;
