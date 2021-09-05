(() => {
  // src/g0/misc.ts
  var X = 0;
  var Y = 1;
  var Z = 2;
  var range = (n) => [...new Array(n)].map((_, i) => i);
  var rangef = (n, f) => [...new Array(n)].map((_, i) => f ? f(i) : i);
  var PI2 = Math.PI * 2;
  var PI = Math.PI;
  var PIH = Math.PI / 2;
  var PIQ = Math.PI / 4;
  var maxN = 2 ** 31;
  function RNG(seed) {
    if (0 < seed && seed < 1)
      seed = ~~(seed * maxN);
    let rngi = (n) => {
      return (seed = seed * 16807 % 2147483647) % n;
    };
    let rng2 = (n) => {
      return n == -1 ? seed : n == null ? rngi(maxN) / maxN : rngi(n);
    };
    return rng2;
  }
  function dictMap(a, f) {
    let res = {};
    for (let k in a)
      res[k] = f(a[k], k, a);
    return res;
  }
  function hexFromDigits(n) {
    return n.reduce((t, v4) => t * 16 + v4);
  }

  // src/g0/v3.ts
  var axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var len = (v4) => (v4[X] * v4[X] + v4[Y] * v4[Y] + v4[Z] * v4[Z]) ** 0.5;
  var scale = (v4, n) => [v4[X] * n, v4[Y] * n, v4[Z] * n];
  var norm = (v4, l = 1) => scale(v4, l / len(v4));
  var sum = (v4, w) => [v4[X] + w[X], v4[Y] + w[Y], v4[Z] + w[Z]];
  var sub = (v4, w) => [v4[X] - w[X], v4[Y] - w[Y], v4[Z] - w[Z]];
  var cross = (a, b) => [a[Y] * b[Z] - a[Z] * b[Y], a[Z] * b[X] - a[X] * b[Z], a[X] * b[Y] - a[Y] * b[X]];

  // src/g0/v.ts
  var len2 = (v4) => mul(v4, v4) ** 0.5;
  var dist = (v4, w) => len2(sub2(v4, w));
  var scale2 = (v4, n) => v4.map((x) => x * n);
  var mul = (v4, w) => v4.reduce((s, x, i) => s + x * w[i], 0);
  var sum2 = (v4, w) => v4.map((x, i) => x + w[i]);
  var sum22 = (v4, w, n) => v4.map((x, i) => x + w[i] * n);
  var sub2 = (v4, w) => v4.map((x, i) => x - w[i]);
  var angle2d = (a) => [Math.cos(a), Math.sin(a)];
  var lerp = (v4, w, n) => v4.map((x, i) => x * (1 - n) + w[i] * n);

  // src/g0/m4.ts
  var UP = axis[Y];
  var identity = range(16).map((i) => i % 5 ? 0 : 1);
  var multiply = (a, b) => a.map((_, n) => {
    let col = n % 4, row4 = n - col;
    return b[row4] * a[col] + b[row4 + 1] * a[col + 4] + b[row4 + 2] * a[col + 8] + b[row4 + 3] * a[col + 12];
  });
  var sum3 = (a, b) => a.map((x, i) => x + b[i]);
  var scale3 = (m, n) => m.map((x) => n * x);
  var trace = (a) => a[0] + a[5] + a[10] + a[15];
  var sumScale = (a, b, ...args) => {
    const v4 = scale3(b, a);
    return args.length ? sum3(v4, sumScale(...args)) : v4;
  };
  function matInfo(A) {
    const AA = multiply(A, A);
    const AAA = multiply(A, AA);
    const AAAA = multiply(AA, AA);
    const trA = trace(A);
    const trAA = trace(AA);
    const trAAA = trace(AAA);
    const trAAAA = trace(AAAA);
    const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
    return [det, AA, AAA, trA, trAA, trAAA];
  }
  function inverse(A) {
    let [det, AA, AAA, trA, trAA, trAAA] = matInfo(A);
    let total = sumScale((trA * trA * trA - 3 * trA * trAA + 2 * trAAA) / 6, identity, -(trA * trA - trAA) / 2, A, trA, AA, -1, AAA);
    return scale3(total, 1 / det);
  }
  var lookTo = (eye, dir, up = UP) => {
    const z = norm(scale(dir, -1));
    const x = norm(cross(up, z));
    const y = cross(x, z);
    return [
      x[X],
      x[Y],
      x[Z],
      0,
      y[X],
      y[Y],
      y[Z],
      0,
      z[X],
      z[Y],
      z[Z],
      0,
      eye[X],
      eye[Y],
      eye[Z],
      1
    ];
  };
  var lookAt = (eye, target, up = UP) => {
    return lookTo(eye, sub(target, eye), up);
  };
  var perspective = (fieldOfViewYInRadians, aspect, zNear, zFar) => {
    const f = 1 / Math.tan(0.5 * fieldOfViewYInRadians);
    const rangeInv = 1 / (zNear - zFar);
    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (zNear + zFar) * rangeInv,
      -1,
      0,
      0,
      zNear * zFar * rangeInv * 2,
      0
    ];
  };
  function axisRotation(axis2, angleInRadians) {
    let [x, y, z] = axis2;
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    return [
      x * x + (1 - x * x) * c,
      x * y * oneMinusCosine + z * s,
      x * z * oneMinusCosine - y * s,
      0,
      x * y * oneMinusCosine - z * s,
      y * y + (1 - y * y) * c,
      y * z * oneMinusCosine + x * s,
      0,
      x * z * oneMinusCosine + y * s,
      y * z * oneMinusCosine - x * s,
      z * z + (1 - z * z) * c,
      0,
      0,
      0,
      0,
      1
    ];
  }
  function transform(m, v4) {
    const [v0, v1, v22] = v4;
    const d = v0 * m[3] + v1 * m[7] + v22 * m[11] + m[15];
    return [
      (v0 * m[0] + v1 * m[4] + v22 * m[8] + m[12]) / d,
      (v0 * m[1] + v1 * m[5] + v22 * m[9] + m[13]) / d,
      (v0 * m[2] + v1 * m[6] + v22 * m[10] + m[14]) / d
    ];
  }
  var scaling = (n) => range(16).map((i) => i == 15 ? 1 : i % 5 ? 0 : n);
  var translation = (v4) => [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    v4[X],
    v4[Y],
    v4[Z],
    1
  ];
  function camera(at, dir, [width, height], fov, [zNear, zFar]) {
    let aspect = width / height;
    const look = lookAt(at, sum(at, dir), axis[Z]);
    const mPerspective = perspective(fov, aspect, zNear, zFar);
    const mCamera = multiply(mPerspective, inverse(look));
    return mCamera;
  }
  function reflection([a, b, c]) {
    return [
      1 - 2 * a * a,
      -2 * a * b,
      -2 * a * c,
      0,
      -2 * a * b,
      1 - 2 * b * b,
      -2 * b * c,
      0,
      -2 * a * c,
      -2 * b * c,
      1 - 2 * c * c,
      0,
      0,
      0,
      0,
      1
    ];
  }

  // src/g0/glconst.ts
  var DEPTH_BUFFER_BIT = 256;
  var COLOR_BUFFER_BIT = 16384;
  var TRIANGLES = 4;
  var ARRAY_BUFFER = 34962;
  var ELEMENT_ARRAY_BUFFER = 34963;
  var STATIC_DRAW = 35044;
  var TEXTURE_2D = 3553;
  var DEPTH_TEST = 2929;
  var UNSIGNED_BYTE = 5121;
  var UNSIGNED_SHORT = 5123;
  var INT = 5124;
  var UNSIGNED_INT = 5125;
  var FLOAT = 5126;
  var DEPTH_COMPONENT = 6402;
  var RGBA = 6408;
  var FRAGMENT_SHADER = 35632;
  var VERTEX_SHADER = 35633;
  var NEAREST = 9728;
  var TEXTURE_MAG_FILTER = 10240;
  var TEXTURE_MIN_FILTER = 10241;
  var FLOAT_VEC3 = 35665;
  var FLOAT_MAT4 = 35676;
  var FRAMEBUFFER = 36160;
  var DEPTH_COMPONENT16 = 33189;
  var DEPTH_STENCIL = 34041;
  var COLOR_ATTACHMENT0 = 36064;
  var DEPTH_ATTACHMENT = 36096;
  var DEPTH_STENCIL_ATTACHMENT = 33306;
  var COLOR_ATTACHMENT1 = 36065;

  // src/g0/shape.ts
  var ATTRSIZE = 0;
  var ATTRTYPE = 1;
  var defaultAttrs = {at: [3], norm: [3], cell: [3]};
  function calculateFlatNormals(s) {
    for (let f of s.faces) {
      if (f[2].norm == null || Number.isNaN(f[2].norm[X]))
        f[2].norm = norm(cross(sub(f[0].at, f[2].at), sub(f[1].at, f[2].at)));
    }
  }
  var transformShape = (shape3, ...mats) => {
    for (let mat of mats)
      for (let vert of shape3.verts)
        vert.at = transform(mat, vert.at);
  };
  function reindexVerts(shape3) {
    shape3.verts.forEach((v4, i) => v4.ind = i);
    return shape3;
  }
  function combine(shapes) {
    return reindexVerts({faces: flat(shapes.map((s) => s.faces)), verts: flat(shapes.map((s) => s.verts))});
  }
  function addUp(arr) {
    let total = 0;
    return [0, ...arr.map((el) => total += el.length)];
  }
  function flat(arr, makeArray = (n) => new Array(n)) {
    const numEl = addUp(arr);
    let flattened = makeArray(numEl[arr.length]);
    let skip;
    for (let i = arr.length - 1; i >= 0; i--) {
      skip = i == 0 ? 0 : numEl[i];
      for (let j = arr[i].length - 1; j >= 0; j--)
        flattened[skip + j] = arr[i][j];
    }
    return flattened;
  }
  function shapesToElements(shapes, attrs) {
    let l = shapes.length;
    let faceCount = addUp(shapes.map((s) => s.faces));
    let vertCount = addUp(shapes.map((s) => s.verts));
    let faces = new Uint32Array(faceCount[l] * 3);
    let verts = dictMap(attrs, (v4) => {
      if (v4[ATTRTYPE] && v4[ATTRTYPE] != FLOAT) {
        return new Int32Array(vertCount[l] * v4[ATTRSIZE]);
      } else {
        return new Float32Array(vertCount[l] * v4[ATTRSIZE]);
      }
    });
    let f = 0;
    shapes.forEach((shape3, shapei) => {
      for (let face of shape3.faces) {
        const vShift = vertCount[shapei];
        faces[f++] = face[0].ind + vShift;
        faces[f++] = face[1].ind + vShift;
        faces[f++] = face[2].ind + vShift;
      }
    });
    for (let bufName in verts) {
      let size = attrs[bufName][ATTRSIZE];
      let buf = verts[bufName];
      let i = 0;
      if (size == 1) {
        for (let shape3 of shapes) {
          for (let vert of shape3.verts) {
            if (vert[bufName])
              buf[i] = vert[bufName];
            i++;
          }
        }
      } else {
        for (let shape3 of shapes) {
          for (let vert of shape3.verts) {
            if (vert[bufName])
              buf.set(vert[bufName], i * size);
            i++;
          }
        }
        ;
      }
    }
    return {faces, verts};
  }
  function mesh(cols, rows, shader2) {
    let faces = new Array(cols * rows * 2), verts = new Array((cols + 1) * (rows + 1));
    let verticeCols = cols + 1;
    for (let x = 0; x <= cols; x++)
      for (let y = 0; y <= rows; y++)
        verts[y * verticeCols + x] = {at: shader2(x, y), cell: [x, y, 0], ind: y * verticeCols + x};
    for (let x = 0; x < cols; x++)
      for (let y = 0; y < rows; y++) {
        const fi = 2 * (y * cols + x);
        const vi = y * verticeCols + x;
        faces[fi] = [verts[vi + 1 + verticeCols], verts[vi + verticeCols], verts[vi]];
        faces[fi + 1] = [verts[vi + 1], verts[vi + 1 + verticeCols], verts[vi]];
      }
    return {faces, verts};
  }
  var revolutionShader = (sectors) => (x) => angle2d(PI2 / sectors * x);
  var towerShader = (slice, curve) => (x, y) => {
    return [
      slice[x % slice.length][X] * curve[y][X],
      slice[x % slice.length][Y] * curve[y][X],
      curve[y][Y]
    ];
  };
  var towerMesh = (slice, curve) => twoCurvesMesh(slice, curve, towerShader);
  var coveredTowerMesh = (slice, curve) => {
    let bottom = curve[0][Y], top = curve[curve.length - 1][Y];
    const side = (h) => mesh(slice.length / 2, 1, (x, y) => [...slice[y == 0 ? x : slice.length - x - 1], h]);
    let side1 = side(bottom);
    let side2 = side(top);
    invert(side1);
    let part = towerMesh(slice, curve);
    return combine([part, side1, side2]);
  };
  var twoCurvesMesh = (slice, curve, shader2) => mesh(slice.length, curve.length - 1, shader2(slice, curve));
  var smoothPoly = (curve, gap) => flat(curve.map((v4, i) => {
    let w = curve[(i + 1) % curve.length];
    return [lerp(v4, w, gap), lerp(v4, w, 1 - gap)];
  }));
  var smoothPolyFixed = (curve, gap) => flat(curve.map((v4, i) => {
    let w = curve[(i + 1) % curve.length];
    let d = dist(v4, w);
    let g = gap / d;
    return [lerp(v4, w, g), lerp(v4, w, 1 - g)];
  }));
  var circle = (divs) => rangef(divs, (i) => angle2d(i / (divs - 1) * PI2));
  function clone(shape3) {
    let s2 = {...shape3};
    s2.verts = JSON.parse(JSON.stringify(shape3.verts));
    s2.faces = shape3.faces.map((f) => f.map((v4) => s2.verts[v4.ind]));
    return s2;
  }
  function invert(shape3) {
    shape3.faces = shape3.faces.map((f) => [f[1], f[0], f[2]]);
  }
  function reflect(shape3, norm2) {
    transformShape(shape3, reflection(norm2));
    invert(shape3);
  }

  // src/g0/gl.ts
  var gl;
  var debug = true;
  function context(c) {
    gl = c.getContext("webgl2");
    gl.enable(DEPTH_TEST);
  }
  function shader(mode, body) {
    let src = `#version 300 es
precision highp float;
precision highp int;

${body}`;
    const shader2 = gl.createShader(mode);
    gl.shaderSource(shader2, src);
    gl.compileShader(shader2);
    if (debug) {
      const e = gl.getShaderInfoLog(shader2);
      if (e) {
        console.log("shader:", e);
        console.log(src.split("\n").map((s, i) => `${i + 1}. ${s}`).join("\n"));
      }
    }
    return shader2;
  }
  function compile(vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, shader(VERTEX_SHADER, vs));
    gl.attachShader(program, shader(FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    return program;
  }
  var TEX_RGBA = [UNSIGNED_BYTE, RGBA];
  var TEX_DEPTHS = [UNSIGNED_SHORT, DEPTH_COMPONENT, DEPTH_COMPONENT16];
  function texture(width, height, format, source) {
    const texture2 = gl.createTexture();
    gl.bindTexture(TEXTURE_2D, texture2);
    gl.texImage2D(TEXTURE_2D, 0, format[2] || format[1], width, height, 0, format[1], format[0], source);
    gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
    gl.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST);
    gl.bindTexture(TEXTURE_2D, null);
    return {texture: texture2, format};
  }
  function framebuffer(textures3) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(FRAMEBUFFER, fb);
    for (let i = 0; i < textures3.length; i++) {
      let format = textures3[i].format[1];
      let attachment = format == DEPTH_STENCIL ? DEPTH_STENCIL_ATTACHMENT : format == DEPTH_COMPONENT ? DEPTH_ATTACHMENT : COLOR_ATTACHMENT0 + i;
      gl.framebufferTexture2D(FRAMEBUFFER, attachment, TEXTURE_2D, textures3[i].texture, 0);
    }
    gl.bindFramebuffer(FRAMEBUFFER, null);
    return fb;
  }
  function textures(formats, [width, height]) {
    return formats.map((format) => texture(width, height, format));
  }
  function bindTextures(textures3, uniforms2) {
    for (let i = 0; i < textures3.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      uniforms2[i] && uniforms2[i](i);
      gl.bindTexture(TEXTURE_2D, textures3[i].texture);
    }
  }
  var uniformTypes = {[INT]: "i", [UNSIGNED_INT]: "ui", [FLOAT]: "f", [FLOAT_VEC3]: "f", [FLOAT_MAT4]: "Matrix4fv"};
  function uniforms(p) {
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
      const info = gl.getActiveUniform(p, i);
      let suffix = uniformTypes[info.type] || "i";
      const loc = gl.getUniformLocation(p, info.name);
      if (suffix.indexOf("Matrix") >= 0)
        u[info.name] = (...args) => gl[`uniform${suffix}`](loc, false, ...args);
      else
        u[info.name] = (...args) => {
          if (args[0].length > 0)
            args = args[0];
          gl[`uniform${args.length}${suffix}`](loc, ...args);
        };
    }
    return u;
  }
  function setUniforms(u, values) {
    for (let k in values) {
      if (u[k])
        u[k](values[k]);
    }
  }
  function attr(program, name, buffer, itemSize = 3, itemType = FLOAT) {
    let loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(loc, itemSize, itemType, false, 0, 0);
  }
  function databuffer() {
    return gl.createBuffer();
  }
  function createDatabuffers(attrs = defaultAttrs) {
    return {faces: databuffer(), verts: dictMap(attrs, (_) => databuffer()), attrs};
  }
  function setDatabuffer(buffer, data, bindingPoint = ARRAY_BUFFER) {
    gl.bindBuffer(bindingPoint, buffer);
    gl.bufferData(bindingPoint, data, STATIC_DRAW);
  }
  function setDatabuffers(buffers, elements) {
    setDatabuffer(buffers.faces, elements.faces, ELEMENT_ARRAY_BUFFER);
    for (let k in elements.verts)
      setDatabuffer(buffers.verts[k], elements.verts[k]);
  }
  function setAttrDatabuffers(buffers, prog) {
    for (let key in buffers.verts)
      attr(prog, key, buffers.verts[key], buffers.attrs[key][ATTRSIZE], buffers.attrs[key][ATTRTYPE] || FLOAT);
  }
  function putShapesInElementBuffers(shapes, attrs) {
    let elements = shapesToElements(shapes, attrs);
    let bufs = createDatabuffers(attrs);
    setDatabuffers(bufs, elements);
    return [bufs, elements];
  }

  // src/generator.ts
  var ts = transformShape;
  var BUILDING = 2;
  var FLYER = 3;
  var TUNNEL = 4;
  var WARPER = 5;
  var SHIP = 7;
  var cityCols = 72;
  var cityRows = 120;
  var cityRadius = 400;
  var cityRowGap = 40;
  var citySize = cityCols * cityRows;
  var cityDepth = cityRows * cityRowGap;
  function putWorldnBuffers(world, pMain2) {
    let [bufs, elements] = putShapesInElementBuffers(world, {at: [3], norm: [3], cell: [3], type: [4], shape: [1]});
    setAttrDatabuffers(bufs, pMain2);
    return [bufs, elements];
  }
  function initGeometry() {
    let rng2 = RNG(1);
    let world = generateCity(rng2);
    let flyer = flyerGeometry();
    world.push(flyer);
    for (let i = 0; i < 300; i++) {
      let ship = shipGeometry(rng2, i);
      let sector = i % 6;
      ts(ship, axisRotation([0, 1, 0], PIH + (sector < 3 ? PI : 0)), scaling(rng2(5) + 2), translation([0, 0, cityRadius * (0.35 + rng2() * 0.15)]), axisRotation([0, 1, 0], sector * PI2 / 6 + PI2 * 5 / 12 + rng2() * 0.2 - 0.1));
      world.push(ship);
    }
    calculateAllNormals(world);
    return world;
  }
  function flyerGeometry() {
    let wing = towerMesh(smoothPolyFixed([[0, -4], [6, -5], [0, 4], [-6, -5]], 2), [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.1], [0, 1.1]]);
    ts(wing, translation([0, 13, 5]));
    let engine = towerMesh(smoothPolyFixed([[-1, 0], [1, 0], [1, 2], [-1, 2]], 0.5), [[0, 0], [0.8, 0], [1, 1], [1, 1], [0.5, 3], [0, 3]]);
    ts(engine, axisRotation([1, 0, 0], -PIH), translation([2, 8.5, 6.2]));
    let engine2 = clone(engine);
    ts(engine2, reflection([1, 0, 0]));
    invert(engine2);
    let body = towerMesh(smoothPolyFixed([[1, -4], [1, 7], [0, 10], [-1, 7], [-1, -4]], 1), [[0, 1], [0.8, 1], [1, 2], [1, 3], [0.4, 4], [0, 4]]);
    ts(body, translation([0, 12, 3.5]));
    let flyer = combine([body, wing, engine, engine2]);
    for (let v4 of flyer.verts)
      v4.type = [FLYER, 0, 0, 0];
    ts(flyer, scaling(0.25), axisRotation([0, -1, 0], Math.PI), axisRotation([-1, 0, 0], Math.PI / 2), translation([0, 3, 0]));
    return flyer;
  }
  function generateCity(rng2) {
    let shapes = [];
    let buildings = generateBuildings(rng2);
    tunnelCity(buildings, rng2);
    buildings.forEach((b) => b && shapes.push(b));
    let tunnel = tunnelGeometry(rng2, cityCols, cityRadius, cityRadius * 1.3, cityRows * cityRowGap);
    ts(tunnel, axisRotation(axis[X], -Math.PI / 2));
    shapes.push(tunnel);
    return shapes;
  }
  function calculateAllNormals(shapes) {
    for (let p of shapes)
      calculateFlatNormals(p);
  }
  function tunnelGeometry(rng2, divs, r1, r2, h) {
    let circle2 = circle(divs);
    let horns = [];
    for (let i = 0; i < divs - 1; i++) {
      let hh = rng2() * 1e3;
      let choke = i / divs * 6 % 1 < 0.5 ? 0.8 : 1;
      let horn = towerMesh([
        scale2(circle2[i], r1),
        scale2(circle2[(i + 1) % divs], r1),
        scale2(circle2[(i + 1) % divs], r2),
        scale2(circle2[i], r2)
      ].reverse(), [[1, -hh], [1, h * 0.96], [choke, h * 0.98], [choke, h * 1.03]]);
      horns.push(horn);
    }
    let warper = towerMesh(circle2, [[0, h], [r2, h], [r2 * 1.2, h], [r2 * 1.2, h * 1.2], [0, h * 1.2]]);
    for (let v4 of warper.verts)
      if (v4.cell[Y] == 0)
        v4.type = [WARPER, 0, 0, 0];
    let combined = combine([warper, ...horns]);
    for (let v4 of combined.verts)
      v4.type = v4.type || [TUNNEL, 0, 0, 0];
    return combined;
  }
  function roundTower2(rng2, r, i, size) {
    let [curve, types] = generateBuildingCurve(rng2, size, r);
    let sectors = rng2(4) + 4;
    let slice;
    slice = rangef(sectors, (a) => revolutionShader(sectors)(a));
    if (!rng2(3))
      slice = smoothPoly(slice, 0.1);
    if (rng2(4) == 0)
      slice.forEach((v4) => v4[Y] += 0.95);
    let building = twoCurvesMesh(slice, curve, towerShader);
    for (let v4 of building.verts) {
      v4.type = types[v4.cell[Y]];
      v4.shape = i;
    }
    return building;
  }
  function generateBuildings(rng2) {
    let buildings = [];
    for (let i = 0; i < citySize; i++) {
      let a = i % cityCols / cityCols * PI2;
      let s = Math.sin(a * 6 + PI / 2) * 1.3;
      let density = Math.min(1.4 - Math.abs(0.5 - i / citySize) * 3, s * 0.5 + 1);
      if (density > rng2()) {
        let r = 10 + rng2(10);
        if (!rng2(100))
          r *= 2;
        let building = roundTower2(rng2, r, i, density * 13 / r);
        buildings[i] = building;
      }
    }
    return buildings;
  }
  function tunnelCity(shapes, rng2) {
    for (let i = 0; i < citySize; i++) {
      if (!shapes[i])
        continue;
      let a = i % cityCols / cityCols * PI2;
      ts(shapes[i], axisRotation(axis[Z], rng2() * PI2), translation([0, i / citySize * cityDepth, -cityRadius]), axisRotation(axis[Y], a));
    }
  }
  var HM = 0;
  var VM = 1;
  function generateBuildingCurve(rng2, size, r) {
    let [x, y] = [1, 0];
    let curve = [[0, 0], [x * r, 0]];
    let types = [[0, 0, 0, 0]];
    let w = 2, b = 0;
    let gaps = [rng2(6) + 2, rng2(6) + 2, rng2(6), rng2(6)];
    let windowDensity = [r * (rng2() + 0.3) / 4, r * (rng2() + 0.3)];
    while (x > 0.2 && y < 20 * size && (y < 10 * size || rng2(3) || curve.length < 4)) {
      let dx = w > 1 ? 0 : x * (0.1 + rng2() * 0.5) * (rng2(4) ? -1 : 1);
      if (x + dx > 1)
        dx = -dx;
      let dy = w * (x + b++ / 10) * (rng2() + 0.3) ** 2;
      if (y < 5 && dy > 0)
        dy++;
      x += dx;
      y += dy;
      if (y > 20 * size)
        y = (20 + rng2() * 3) * size;
      curve.push([x * r, y * r]);
      let cols = ~~(dy * windowDensity[0]) || 1;
      let rows = ~~(x * windowDensity[1]) || 1;
      let windowArea = (1 - gaps[HM] / 15) * (1 - gaps[VM] / 15);
      if (dx != 0)
        cols = 1;
      types.push([
        BUILDING,
        cols * 256 + rows,
        hexFromDigits(gaps),
        windowArea * 256
      ]);
      let nw = rng2(3);
      w = nw == 0 && w == 0 ? 2 : nw;
    }
    curve.push([0, y * r]);
    types.push([BUILDING, 2056, 57344, 0]);
    return [curve, types];
  }
  function generateShipPart(rng2, bends, bounds, curve) {
    let sides = [rng2() * bounds[Y][0], rng2() * bounds[Y][1]];
    let x = bounds[0][X];
    let slices = [[[x, sides[X]]], [[x, sides[Y]]]];
    let step = (bounds[X][1] - bounds[X][0]) / (bends[0] + bends[1]);
    if (step < 0)
      return;
    for (let i = 0; i < 20; i++) {
      x = x + rng2() * step;
      if (x > bounds[X][1])
        x = bounds[X][1];
      if (rng2() < bends[0] / (bends[0] + bends[1]))
        sides[0] = rng2() * bounds[Y][0];
      if (rng2() < bends[1] / (bends[0] + bends[1]))
        sides[1] = rng2() * bounds[Y][1];
      slices[0].push([x, sides[0]]);
      slices[1].push([x, sides[1]]);
      if (x >= bounds[X][1])
        break;
    }
    slices[0].push([x, sides[0]]);
    slices[1].push([x, sides[1]]);
    let slice = smoothPoly([...slices[0], ...slices[1].reverse()].map((v4) => [v4[0], v4[1] / 2]), 0.1);
    return coveredTowerMesh(slice, curve);
  }
  function shipGeometry(rng2, id) {
    let hullLength = 5 + rng2(15);
    let hullWidth = 0.5 + rng2();
    let hullHeight = 0.5 + rng2();
    let wingWidth = 0.1 + rng2() * 3;
    let wing1 = generateShipPart(rng2, [rng2(3) + 1, rng2(3) + 1], [[0, hullWidth + 1 + rng2(5)], [-2 - rng2() * hullLength / 3, 6 + rng2() * hullLength / 2]], [[1, 0], [1.5, wingWidth * 0.33], [1.5, wingWidth * 0.66], [1, wingWidth]]);
    let wing2 = clone(wing1);
    reflect(wing2, [1, 0, 0]);
    let body = generateShipPart(rng2, [rng2(3) + 1, rng2(3) + 1], [[-3, hullLength], [-4 * hullHeight, 4 * hullHeight]], [[1, -2 * hullWidth], [1.5, -1 * hullWidth], [1.5, 1 * hullWidth], [1, 2 * hullWidth]]);
    ts(body, axisRotation([0, 0, -1], PIH), axisRotation([0, 1, 0], PIH));
    let ship = combine([body, wing1, wing2]);
    for (let v4 of ship.verts)
      v4.type = [SHIP, id, 0, 0];
    return ship;
  }

  // src/shaders/fMain.glsl
  var fMain_default = "uniform float time;\n\nin vec3 vcell;\nin vec3 vat;\nin float dist;\n\nflat in float light;\nflat in vec3 vnorm;\nflat in vec4 vcolor;\n\nflat in ivec4 vtype;\nflat in int vshape;\n\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\n\nfloat hexDigitF(int n, int place) {\n  return float((n >> (place * 4)) & 15) / 15.;\n}\n\nint hex2Digit(int n, int place) {\n  return (n >> (place * 8)) % 256;\n}\n\nvoid main() {\n  //vec4 worldAt = \n  int itype = vtype.x;\n  int t1 = vtype.y;\n  int t2 = vtype.z;\n  float bright = light;\n  //vt = 2.0101000000;\n  if(itype == 2) {\n    float hm = hexDigitF(t2, 0);\n    float vm = hexDigitF(t2, 1);\n    float x = fract(vcell.x);\n    float y = fract(vcell.y);\n\n    float far = 0., near = 0.;\n\n    if(dist >= 500.) {\n      //bright *= float(vtype.a)/256.;\n      far = x > hm &&\n        x < 1. - hm &&\n        y > vm &&\n        y < 1. - vm ? -float(vtype.a) / 256. : .0;\n    }\n\n    if(dist <= 700.) {\n      float cols = float(hex2Digit(t1, 1));\n      float rows = float(hex2Digit(t1, 0));\n      float hb = hexDigitF(t2, 2);\n      float vb = hexDigitF(t2, 3);\n      near = x > hm &&\n        x < 1. - hm &&\n        y > vm &&\n        y < 1. - vm &&\n        (cols == 1. || fract((x - hm) / (1. - hm*2.) * cols) > hb) &&\n        (rows ==1. || fract((y - vm) / (1. - vm*2.) * rows) > vb) ? -1. : .0;\n    }\n\n    \n\n    float l = clamp((dist-500.)/200., 0., 1.);\n    bright += mix(near, far, l);\n\n  } else if(itype == 4) {\n    bright += vat.z * 5e-4 + (fract(vat.y / 20. + 0.55) < .1 || fract(atan(vat.x, vat.z) / 3.141 * 70.) < .1 ? -1. : 0.);\n  } else if(itype == 5) {\n    bright = 2.;\n  }\n\n  if(bright > 0.)\n    bright += vcell.y * 0.05 - 0.3;\n  /*if(mod(vcell.x,0.2)<0.1 != mod(vcell.y,0.2)<0.1)\n    light /= 2.;*/\n  //c0 = vec4(light, 0., 0., 1.);\n  c0 = vec4(vcolor.rgb * bright, vcolor.a);\n  //c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);\n  c1 = vec4(vat / 1000. + 0.5, 1.);\n  //c1 = vec4(1.,0.,0.,1.);\n}\n";

  // src/shaders/fScreen.glsl
  var fScreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\nuniform mat4 invCamera;\nuniform mat4 flyer;\n\nin vec2 uv;\n\nout vec4 color;\n\nfloat Noise2d(in vec2 x) {\n  float xhash = cos(x.x * 37.0);\n  float yhash = cos(x.y * 57.0);\n  return fract(415.92653 * (xhash + yhash));\n}\n\nint b16[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);\nint b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);\n\nfloat dither(float v, ivec2 F) {\n  return v * 75. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;\n}\n\nconst bool ditherOn = true;\n\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  float depth = texelFetch(Depth, F, 0).r;\n  color = vec4(1.);\n\n  if(depth == 1.) {\n    //color = vec4(texelFetch(T1, F, 0).rgb, 1.);\n    vec4 pos4 = invCamera * vec4(uv * 2. - 1., depth * 2. - 1., 1.);\n    vec3 pos = (pos4 / pos4.w).xyz - flyer[3].xyz;\n    pos = pos / length(pos);\n    //color.xyz = vec3(sin((pos.x + pos.y)*1e1)>0.9?1.:0.);\n    //color.xyz = pos / 100.;\n    //float a = atan(pos.x, pos.y);\n    //color.xyz = sin(pos.x * 5e2) > 0.95 || sin(pos.y * 5e2) > 0.95 || sin(pos.z * 5e2) > 0.95 ? pos * 0.5 + 0.5 : vec3(0.);\n\n    //color.xyz = sin(pos.z * 5e2) > 0.85 && sin(pos.x * 5e2) > 0.85 ? pos * 0.5 + 0.5 : vec3(0.);\n\n    if(Noise2d(vec2(floor((pos.x+pos.y)*3e2), floor(pos.z*3e2)))>0.99)\n      color.xyz = pos * 0.5 + 0.5;\n    else\n      color.xyz = vec3(0.);\n\n    //color = vec4(uv, depth, 1.);\n  } else {\n    color = texelFetch(T0, F, 0);\n\n    if(color.r > 0.)\n      color = (color * 2. + texelFetch(T0, F + ivec2(1, 0), 0) + texelFetch(T0, F + ivec2(0, 1), 0)) * 0.25;\n\n    float diff = 0.;\n    for(int i = 0; i < 8; i++) {\n      int step = i / 4;\n      float edge = texelFetch(Depth, F + ivec2(i % 2, i % 4 / 2) * step, 0).r + texelFetch(Depth, F - ivec2(i % 2, i % 4 / 2) * step, 0).r - depth * 2.;\n      diff += abs(edge);\n    }\n\n    if(diff > .00007) {\n      //lut = lit>0.1?0.:1.;\n      color.rgb = normalize(color.rgb) * 0.3;\n    } else {\n      if(ditherOn) {\n        color.r = dither(color.r, F);\n        color.g = dither(color.g, F);\n        color.b = dither(color.b, F);\n      }\n      //lit = lit * 15. > float(b16[F.y % 4 * 4 + F.x % 4]) ? 1. : 0.;\n      //lut = lit;\n    }\n\n    if(depth > 0.995 && (depth - 0.99) * 1000. > float(b64[F.y % 8 * 8 + F.x % 8])) {\n      color = vec4(1.);\n    }\n\n    /*if(depth > 0.99){\n      color.rgb += (depth - 0.99) * 10.;\n    }*/\n\n  }\n\n  //color = vec4(texelFetch(T1, F, 0).rgb, 1.);\n\n  //c.rgb = texelFetch(T0, F, 0).rgb;\n\n  /*if(texelFetch(T1, F, 0).r == 1.)\n    c.rgb = vec3(0., 0., 1.);*/\n  color.a = 1.;\n}";

  // src/shaders/vScreenQuad.glsl
  var vScreenQuad_default = "out vec2 uv;\n\nvoid main() {\n  int i = gl_VertexID;\n  ivec2 uvi = ivec2(i % 2, (i + 1) % 4 / 2);\n  gl_Position = vec4(uvi.x * 2 - 1, 1 - uvi.y * 2, 0, 1);\n  uv = vec2(uvi);\n  //gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders/vMain.glsl
  var vMain_default = "uniform mat4 camera;\r\nuniform mat4 flyer;\r\nuniform vec3 sun;\r\nuniform float time;\r\n\r\nin vec3 at;\r\nin vec3 norm;\r\nin vec3 cell;\r\nin vec4 type;\r\nin float shape;\r\n\r\nout vec3 vcell;\r\nout vec3 vat;\r\nout float dist;\r\nflat out float light;\r\n\r\nflat out vec3 vnorm;\r\nflat out vec4 vcolor;\r\n\r\nflat out ivec4 vtype;\r\nflat out int vshape;\r\n\r\nvoid main() {\r\n  vat = at;\r\n  vnorm = norm;\r\n  vcell = cell;\r\n\r\n  vtype = ivec4(type);\r\n  vshape = int(shape);\r\n\r\n  vec4 at4 = vec4(at, 1.);\r\n\r\n  //int si = int(shape);\r\n\r\n  if(vshape > 0)\r\n    //vcolor.rgb = vec3(shape/10000., mod(shape,100.)/100., mod(shape,10.)/10.) * 1.5;\r\n    vcolor.rgb = vec3(1.);\r\n  else\r\n    vcolor.rgb = vec3(.9);\r\n  //color = vec4(1., 1., 0., 1.);\r\n\r\n  if(vtype.x == 3) {\r\n    at4 = flyer * at4;\r\n    mat4 fnorm = flyer;\r\n    fnorm[3] = vec4(0.);\r\n    vnorm = normalize((fnorm * vec4(norm, 1.)).xyz);\r\n  }\r\n\r\n  if(vtype.x == 7) {\r\n    int id = vtype.y;\r\n    if(id % 2 == 0) {\r\n      vnorm.y = -vnorm.y;\r\n      at4.y = -at4.y;\r\n    }\r\n    float shift = fract((1. + sin(float(id) * 1e4)) + time * (id % 2 == 1 ? 3. : -3.)*3e-5);\r\n    at4.y = at4.y + 5000. - pow(shift*1000.,1.4);\r\n  }\r\n\r\n  vec4 pos = camera * at4;\r\n  vat = at4.xyz;\r\n  pos.y = -pos.y;\r\n\r\n  //vec3 toSun = sun - vat;\r\n  vec3 toSun = vec3(0, 1000, 0);\r\n  light = dot(vnorm, normalize(toSun)) * 0.2 + .9 - length(toSun) * .00014;\r\n\r\n  if(vtype.x == 7) {\r\n    light += 0.2;\r\n  }\r\n\r\n  dist = distance(vat, flyer[3].xyz);\r\n\r\n  gl_Position = pos;\r\n}";

  // src/shaders.ts
  var shaders = {fMain: fMain_default, vMain: vMain_default, fScreen: fScreen_default, vScreenQuad: vScreenQuad_default};
  var shaders_default = shaders;

  // src/render.ts
  var pMain;
  var pScreen;
  var pMainUniform;
  var pScreenUniform;
  var textures2;
  var framebuffer2;
  var viewSize;
  function init(size) {
    let C = document.getElementById("C");
    viewSize = size;
    C.width = viewSize[X];
    C.height = viewSize[Y];
    context(C);
    pMain = compile(shaders_default.vMain, shaders_default.fMain);
    pMainUniform = uniforms(pMain);
    pScreen = compile(shaders_default.vScreenQuad, shaders_default.fScreen);
    pScreenUniform = uniforms(pScreen);
    textures2 = textures([TEX_RGBA, TEX_RGBA, TEX_DEPTHS], viewSize);
    framebuffer2 = framebuffer(textures2);
    return [pMain, C];
  }
  function frame(state2, [bufs, elements]) {
    I.innerHTML = state2.at.map((v4) => ~~v4);
    let time = state2.time;
    let camera2 = camera(sum(sum(state2.at, scale(state2.dir, -5)), [0, 0, 0]), state2.dir, viewSize, PI / 4, [5, cityDepth + dist(state2.at, [0, cityDepth * 0.5, 0])]);
    let invCamera = inverse(camera2);
    let flyer = lookTo(state2.at, state2.dir, [0, 0, 1]);
    flyer = multiply(flyer, axisRotation([0, 0, 1], -state2.smoothDrot[X] * Math.PI / 4 / 100));
    flyer = multiply(flyer, axisRotation([1, 0, 0], -state2.smoothDrot[Y] * Math.PI / 4 / 200));
    gl.useProgram(pMain);
    setUniforms(pMainUniform, {camera: camera2, flyer, sun: [0, cityDepth, 0], time});
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer2);
    gl.clear(DEPTH_BUFFER_BIT | COLOR_BUFFER_BIT);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);
    gl.drawElements(TRIANGLES, elements.faces.length, UNSIGNED_INT, 0);
    gl.useProgram(pScreen);
    setUniforms(pScreenUniform, {invCamera, flyer, time});
    bindTextures(textures2, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    gl.drawArrays(TRIANGLES, 0, 6);
    gl.flush();
  }

  // src/game.ts
  var rad = Math.PI / 180;
  var friction = 0;
  var InitialRot = [90, 0];
  var mouseDelta = [0, 0];
  var state;
  var tilt = 0;
  function init2() {
    state = {
      dir: [1, 0, 0],
      at: [0, -300, 0],
      vel: 0.05,
      time: 0,
      drot: [0, 0],
      smoothDrot: [0, 0],
      rot: InitialRot
    };
    return state;
  }
  function update(dTime) {
    state.time++;
    mouseDelta = mouseDelta.map((d) => Math.sign(d) * Math.min(30, Math.abs(d) * dTime * 60));
    state.drot[X] = state.drot[X] - mouseDelta[X] * 0.1;
    state.drot[Y] = Math.max(-89.999, Math.min(89.999, state.drot[1] - mouseDelta[1] * 0.1));
    let turn = Math.min(1, dTime * 0.01);
    state.smoothDrot = state.smoothDrot.map((prevSmooth, i) => prevSmooth * (1 - turn) + state.drot[i] * turn);
    state.rot = sum22(state.rot, state.smoothDrot, 6e-3);
    state.rot[Y] = Math.max(-89, Math.min(state.rot[Y], 89));
    state.smoothDrot = scale2(state.smoothDrot, 1 - turn * 0.2);
    let [yaw, pitch] = state.rot.map((v4) => v4 * rad);
    state.dir = norm([
      Math.cos(pitch) * Math.cos(yaw),
      Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch)
    ]);
    tilt += mouseDelta[0];
    tilt *= 1 - 10 * dTime;
    mouseDelta = [0, 0];
    state.vel *= 1 - friction * dTime;
    let delta = scale(state.dir, state.vel * dTime);
    state.at = sum(state.at, delta);
  }
  function initControls() {
    ["keydown", "keyup", "mousedown", "mouseup", "mousemove"].forEach((t) => document.addEventListener(t, (e) => {
      switch (e.type) {
        case "mousemove":
          mouseDelta = sum2(mouseDelta, [e.movementX, e.movementY]);
          break;
        case "mousedown":
          state.vel *= e.button == 0 ? 2 : 0.5;
          break;
      }
    }));
  }

  // src/sound.ts
  var rng = RNG(Math.random());

  // src/prog.ts
  function main() {
    const viewSize2 = [1600, 900];
    let startTime = Date.now();
    let world = initGeometry();
    let [pMain2, C] = init(viewSize2);
    initControls();
    let state2 = init2();
    let [bufs, elements] = putWorldnBuffers(world, pMain2);
    console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);
    let t = 0;
    function update2(dTime) {
      update(dTime);
      frame(state2, [bufs, elements]);
      t++;
    }
    let started = false;
    C.onclick = (e) => {
      togglePlaying(true);
      if (!started) {
        let lastTime = Date.now();
        const loop = () => {
          if (playing())
            update2(Date.now() - lastTime);
          lastTime = Date.now();
          requestAnimationFrame(loop);
        };
        loop();
      }
      started = true;
    };
    document.onkeydown = (e) => {
      switch (e.code) {
        case "Space":
          togglePlaying();
          break;
      }
    };
    function playing() {
      return document.pointerLockElement == C;
    }
    function togglePlaying(on) {
      if (on == null)
        on = !playing();
      if (on)
        C.requestPointerLock();
      else
        document.exitPointerLock();
    }
    update2(0);
  }
  main();
})();
