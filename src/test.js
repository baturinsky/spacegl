import {mTranspose} from "./math3d"

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

  /*const projection2 = m4.perspective(fov, aspect, zNear, zFar)
  const camera2 = m4.lookAt([0, 0, 0], [0, 0, 1], [0, 1, 0]);
  const view2 = m4.inverse(camera2);
  const viewProjection2 = m4.multiply(projection2, view2);
  
  console.log("p", mvMul(viewProjection, [0, 0, 10]));*/
  
//const perspective2 = m4.perspective(fov, aspect, zNear, zFar);
//console.log(perspective2);

/*const perspective2 = m4.perspective(fov, aspect, zNear, zFar);
const look2 = m4.lookAt([0,10,-10],[0, 0, 0],[0,1,0]);
const camera2 = m4.multiply(perspective2, mInverse(look2));

console.log({perspective2, look2, camera2});*/
console.log({perspective, look, camera});

console.log("zero", mvMul(camera, [0,0,0,1]));
console.log("one", mvMul(camera, [-1,-1,1,10]));

console.log("zero", mvMul(ii, [0,0,0,1]));
console.log("one", mvMul(ii, [1,1,1,1]));

let ii = [
  1,0,0,0,
  0,1,0,0,
  0,0,1,0,
  1,10,100,1
];
//console.log(m4.transformPoint(ii, [1,1,1,1]));
console.log("mset", m4.set([1, 2, 3], { 1: 5 }));

const squareVerts = [
  -1, -1, 1, 
  1, -1, 1, 
  -1, 1, 1, 
  1, 1, 1];

const squareFaces = [0, 1, 2, 2, 1, 3];
}

test()