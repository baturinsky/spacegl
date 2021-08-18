import { angle2d, Vec } from "./v3";

export const X = 0, Y = 1, Z = 2;
export const arr: (n: number) => number[] = n => [...new Array(n)].map((_, i) => i);

export type Shape = { vert?: Vec[]; norm?: Vec[]; face?: Vec[]; }

export function pie(r: number, h: number, sectors: number) {
  let vert: Vec[] = [], norm: Vec[] = [], face: Vec[] = [];
  const bottom = sectors * 2, top = sectors * 2 + 1;
  vert[bottom] = [0, 0, 0];
  norm[bottom] = [0, 0, -1];

  vert[top] = [0, 0, h];
  norm[top] = [0, 0, 1];

  const angleStep = Math.PI * 2 / sectors;

  for (let i = 0; i < sectors; i++) {
    let a = angle2d(angleStep * i)
    let an = angle2d(angleStep * (i + 0.5))
    let x = r * a[X];
    let y = r * a[Y];
    vert[i] = [x, y, 0];
    vert[i + sectors] = [x, y, h];
    norm[i] = norm[i + sectors] = [an[X], an[Y], 0]
  }
  for (let i = 0; i < sectors; i++) {
    let j = (i + 1) % sectors;
    face[i * 4] = [i, j, bottom]; //bottom
    face[i * 4 + 1] = [i + sectors, j + sectors, top]; //top
    face[i * 4 + 2] = [j, j + sectors, i];
    face[i * 4 + 3] = [i + sectors, j + sectors, i];
  }
  return { vert, norm, face } as Shape;
}

export function combine(shapes: Shape[]) {
  let total=0;
  return {
    vert: shapes.map(shape => shape.vert).flat(),
    norm: shapes.map(shape => shape.norm).flat(),
    face: shapes.map(shape => {
      let r = shape.face.map(f => f.map(v =>v + total));
      total += shape.vert.length;
      return r;
    }).flat(),
  }

}