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
    let rng4 = (n) => {
      return n == -1 ? seed : n == null ? rngi(maxN) / maxN : rngi(n);
    };
    return rng4;
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
  function lastOf(arr) {
    return arr[arr.length - 1];
  }

  // src/g0/v3.ts
  var axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var len = (v4) => (v4[X] * v4[X] + v4[Y] * v4[Y] + v4[Z] * v4[Z]) ** 0.5;
  var dist = (v4, w) => len(sub(v4, w));
  var scale = (v4, n) => [v4[X] * n, v4[Y] * n, v4[Z] * n];
  var norm = (v4, l = 1) => scale(v4, l / len(v4));
  var mul = (v4, w) => v4[X] * w[X] + v4[Y] * w[Y] + v4[Z] * w[Z];
  var sum = (v4, w) => [v4[X] + w[X], v4[Y] + w[Y], v4[Z] + w[Z]];
  var sumn = (v4, n) => [v4[X] + n, v4[Y] + n, v4[Z] + n];
  var sumvn = (v4, w, n) => [v4[X] + w[X] * n, v4[Y] + w[Y] * n, v4[Z] + w[Z] * n];
  var sub = (v4, w) => [v4[X] - w[X], v4[Y] - w[Y], v4[Z] - w[Z]];
  var cross = (a, b) => [a[Y] * b[Z] - a[Z] * b[Y], a[Z] * b[X] - a[X] * b[Z], a[X] * b[Y] - a[Y] * b[X]];

  // src/g0/v.ts
  var len2 = (v4) => mul2(v4, v4) ** 0.5;
  var dist2 = (v4, w) => len2(sub2(v4, w));
  var scale2 = (v4, n) => v4.map((x) => x * n);
  var mul2 = (v4, w) => v4.reduce((s, x, i) => s + x * w[i], 0);
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
  var combine = (...m) => m.length == 1 ? m[0] : combine(...m.slice(0, m.length - 2), multiply(m[m.length - 1], m[m.length - 2]));
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
  var scalingv = (v4) => range(16).map((i) => i == 15 ? 1 : i % 5 ? 0 : v4[i / 5]);
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
  function viewMatrices(at, dir, [width, height], fov, [zNear, zFar]) {
    let aspect = width / height;
    const look = lookAt(at, sum(at, dir), axis[Z]);
    const mPerspective = perspective(fov, aspect, zNear, zFar);
    const mCamera = multiply(mPerspective, inverse(look));
    return [mCamera, mPerspective, look];
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
  var STREAM_READ = 35041;
  var PIXEL_PACK_BUFFER = 35051;
  var COLOR_ATTACHMENT1 = 36065;
  var SYNC_GPU_COMMANDS_COMPLETE = 37143;

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
    let combined = combine(...mats);
    for (let vert of shape3.verts)
      vert.at = transform(combined, vert.at);
  };
  function reindexVerts(shape3) {
    shape3.verts.forEach((v4, i) => v4.ind = i);
    return shape3;
  }
  function combine2(shapes) {
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
    let faceBuf = new Uint32Array(faceCount[l] * 3);
    let vertBufs = dictMap(attrs, (v4) => {
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
        faceBuf[f++] = face[0].ind + vShift;
        faceBuf[f++] = face[1].ind + vShift;
        faceBuf[f++] = face[2].ind + vShift;
      }
    });
    for (let bufName in vertBufs) {
      let size = attrs[bufName][ATTRSIZE];
      let buf = vertBufs[bufName];
      let i = 0;
      for (let shape3 of shapes) {
        let base = shape3.common ? shape3.common[bufName] : null;
        for (let vert of shape3.verts) {
          let value = vert[bufName] || base;
          if (value)
            if (size == 1)
              buf[i] = value;
            else
              buf.set(value, i * size);
          i++;
        }
      }
    }
    return {faces: faceBuf, verts: vertBufs};
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
  var revolutionShader = (sectors, angle = 0) => (x) => angle2d(PI2 / sectors * x + angle);
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
    return combine2([part, side1, side2]);
  };
  var twoCurvesMesh = (slice, curve, shader2) => mesh(slice.length, curve.length - 1, shader2(slice, curve));
  var smoothPoly = (curve, gap) => flat(curve.map((v4, i) => {
    let w = curve[(i + 1) % curve.length];
    return [lerp(v4, w, gap), lerp(v4, w, 1 - gap)];
  }));
  var smoothPolyFixed = (curve, gap) => flat(curve.map((v4, i) => {
    let w = curve[(i + 1) % curve.length];
    let d = dist2(v4, w);
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
  function quad(verts) {
    return {faces: [[verts[1], verts[2], verts[3]], [verts[0], verts[1], verts[3]]], verts};
  }
  function vertsAt(coords) {
    return coords.map((at, ind) => ({ind, at}));
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
  var uniformTypes = {
    [INT]: "i",
    [UNSIGNED_INT]: "ui",
    [FLOAT]: "f",
    [FLOAT_VEC3]: "f",
    [FLOAT_MAT4]: "Matrix4fv"
  };
  function uniforms(p) {
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
      const info = gl.getActiveUniform(p, i);
      let suffix = uniformTypes[info.type] || "i";
      const loc = gl.getUniformLocation(p, info.name);
      let f = info.size > 1 ? (args) => {
        gl[`uniform1${suffix}v`](loc, args);
      } : suffix.indexOf("Matrix") >= 0 ? (args) => gl[`uniform${suffix}`](loc, false, args) : (...args) => {
        if (args[0].length > 0)
          args = args[0];
        gl[`uniform${args.length}${suffix}`](loc, ...args);
      };
      u[info.name] = f;
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
    gl.bindBuffer(bindingPoint, null);
  }
  function setDatabuffers(buffers, elements) {
    setDatabuffer(buffers.faces, elements.faces, ELEMENT_ARRAY_BUFFER);
    for (let k in elements.verts)
      setDatabuffer(buffers.verts[k], elements.verts[k]);
  }
  function setAttrDatabuffers(buffers, prog) {
    for (let key2 in buffers.verts)
      attr(prog, key2, buffers.verts[key2], buffers.attrs[key2][ATTRSIZE], buffers.attrs[key2][ATTRTYPE] || FLOAT);
  }
  function putShapesInElementBuffers(shapes, attrs) {
    let elements = shapesToElements(shapes, attrs);
    let bufs = createDatabuffers(attrs);
    setDatabuffers(bufs, elements);
    return [bufs, elements];
  }
  function clientWaitAsync(sync, flags, interval_ms) {
    return new Promise((resolve, reject) => {
      function test() {
        const res = gl.clientWaitSync(sync, flags, 0);
        if (res == gl.WAIT_FAILED) {
          reject();
          return;
        }
        if (res == gl.TIMEOUT_EXPIRED) {
          setTimeout(test, interval_ms);
          return;
        }
        resolve(null);
      }
      test();
    });
  }
  async function getBufferSubDataAsync(target, buffer, srcByteOffset, dstBuffer, dstOffset, length) {
    const sync = gl.fenceSync(SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    await clientWaitAsync(sync, 0, 10);
    gl.deleteSync(sync);
    gl.bindBuffer(target, buffer);
    gl.getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length);
    gl.bindBuffer(target, null);
    return dstBuffer;
  }
  async function readPixelsAsync(x, y, w, h, format, type, dstBuffer) {
    const buf = gl.createBuffer();
    gl.bindBuffer(PIXEL_PACK_BUFFER, buf);
    gl.bufferData(PIXEL_PACK_BUFFER, dstBuffer.byteLength, STREAM_READ);
    gl.readPixels(x, y, w, h, format, type, 0);
    gl.bindBuffer(PIXEL_PACK_BUFFER, null);
    await getBufferSubDataAsync(PIXEL_PACK_BUFFER, buf, 0, dstBuffer);
    gl.deleteBuffer(buf);
    return dstBuffer;
  }

  // src/generator.ts
  var ts = transformShape;
  var BUILDING = 2;
  var FLYER = 3;
  var TUNNEL = 4;
  var WARPER = 5;
  var SHIP = 7;
  var DEBRIS = 9;
  var cityCols = 72;
  var cityRows = 180;
  var cityRadius = 400;
  var cityRowGap = 40;
  var citySize = cityCols * cityRows;
  var cityDepth = cityRows * cityRowGap;
  var cityColGap = cityRadius * PI2 / cityCols;
  var ShipsNumber = 150;
  var MaxDebris = 30 * 64;
  var debris = [];
  function initGeometry() {
    let rng4 = RNG(1);
    let buildings = generateCity(rng4);
    let solid = buildings.filter((b) => b);
    let tunnel = tunnelGeometry(rng4, 72, cityRadius, cityRadius * 1.3, cityRows * cityRowGap);
    ts(tunnel, axisRotation(axis[X], -Math.PI / 2));
    solid.push(tunnel);
    let passable = [];
    let flyer = flyerGeometry();
    passable.push(flyer);
    for (let i2 = 0; i2 < ShipsNumber; i2++) {
      let ship = shipGeometry(rng4, i2);
      let sector = i2 % 6;
      ts(ship, axisRotation([0, 1, 0], PIH + (sector < 3 ? PI : 0)), scaling(rng4(5) + 2), translation([0, 0, cityRadius * (0.35 + rng4() * 0.15)]), axisRotation([0, 1, 0], sector * PI2 / 6 + PI2 * 5 / 12 + rng4() * 0.2 - 0.1));
      solid.push(ship);
    }
    while (debris.length < MaxDebris) {
      let building = buildings[rng4(buildings.length)];
      if (building && building.height * rng4() < building.density && building.density > 0.4) {
        let score = ~~((building.density / (building.height + 10) * 400) ** 2 + 1);
        let at = lastOf(building.verts).at;
        let up = sub(at, building.verts[building.verts.length - 2].at);
        let d = {ind: debris.length, at, up, live: true, score};
        debris.push(d);
      }
    }
    debris.forEach((debris2, ind) => {
      for (let i2 = 0; i2 < 32; i2++) {
        let size = rng4() * 3 + 1;
        let debrisShape = quad(vertsAt([
          [-size / 2, -size / 2, 0],
          [-size / 2, size, 0],
          [size / 2, size / 2, 0],
          [size / 2, -size / 2, 0]
        ]));
        debrisShape.common = {
          type: [DEBRIS, ...debris2.at],
          shape: debris2.ind * 32 + i2,
          up: debris2.up
        };
        passable.push(debrisShape);
      }
    });
    let i = 0;
    for (let s of [...solid, ...passable]) {
      i++;
      calculateFlatNormals(s);
      s.common = s.common || {};
      s.common.shape = s.common.shape || i;
    }
    return [solid, passable];
  }
  function flyerGeometry() {
    let wing = towerMesh(smoothPolyFixed([[0, -4], [6, -5], [0, 4], [-6, -5]], 2), [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.1], [0, 1.1]]);
    ts(wing, translation([0, 3, 5]));
    let engine = towerMesh(smoothPolyFixed([[-1, 0], [1, 0], [1, 2], [-1, 2]], 0.5), [[0, 0], [0.8, 0], [1, 1], [1, 1], [0.5, 3], [0, 3]]);
    ts(engine, axisRotation([1, 0, 0], -PIH), translation([2, -1.5, 6.2]));
    let engine2 = clone(engine);
    ts(engine2, reflection([1, 0, 0]));
    invert(engine2);
    let body = towerMesh(rangef(32, revolutionShader(32)), [[0, 0], [3.9, 0], [4, 0.1], [4, 0.9], [3.9, 1], [0, 1]]);
    ts(body, translation([0, 2.5, 5.5]));
    let body2 = towerMesh(rangef(32, revolutionShader(32)), [[0, 0], [0.9, 0], [1, 0.1], [1, 0.9], [0.9, 1], [0, 1]]);
    ts(body2, translation([0, 4, 6]));
    let flyer = combine2([body, body2, wing, engine, engine2]);
    flyer.common = {type: [FLYER, 0, 0, 0]};
    ts(flyer, scaling(0.18), axisRotation([0, -1, 0], Math.PI), axisRotation([-1, 0, 0], Math.PI / 2), translation([0, 2, 0]));
    return flyer;
  }
  function generateCity(rng4) {
    let buildings = generateBuildings(rng4);
    tunnelCity(buildings);
    return buildings;
  }
  function tunnelGeometry(rng4, divs, r1, r2, h) {
    let circle2 = circle(divs);
    let horns = [];
    for (let i = 0; i < divs - 1; i++) {
      let hh = rng4() * 1e3;
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
    let combined = combine2([warper, ...horns]);
    combined.common = {type: [TUNNEL, 0, 0, 0]};
    return combined;
  }
  function roundTower2(rng4, r, i, height, simple) {
    let slice, curve, types;
    if (simple) {
      [curve, types] = generateBuildingCurve(rng4, height, r * (0.5 + rng4() * 0.4), true);
      slice = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    } else {
      let sectors = rng4(4) + 4;
      [curve, types] = generateBuildingCurve(rng4, height, r);
      slice = rangef(sectors, (a) => revolutionShader(sectors, PIQ)(a));
      if (!rng4(3))
        slice = smoothPoly(slice, 0.1);
      if (rng4(4) == 0)
        slice.forEach((v4) => v4[Y] += 0.95);
    }
    let building = twoCurvesMesh(slice, curve, towerShader);
    for (let v4 of building.verts) {
      v4.type = types ? types[v4.cell[Y]] : [2, 0, 0, 0];
    }
    return building;
  }
  function densityIn(i) {
    let a = i % cityCols / cityCols * PI2;
    let s = Math.sin(a * 6 + PI / 2);
    let density = Math.min(1.4 - Math.abs(0.5 - i / citySize) * 3, s * 0.5 + 1);
    return density;
  }
  function generateBuildings(rng4) {
    let buildings = new Array(citySize), heights = new Array(citySize);
    for (let i = 0; i < citySize; i++) {
      if (heights[i])
        continue;
      let extend = [rng4(4) ? 0 : rng4(3), rng4(4) ? 0 : rng4(3)];
      let height = 0;
      let slots = [];
      for (let x = 0; x <= extend[X]; x++)
        for (let y = 0; y <= extend[Y]; y++)
          slots.push(i + x + y * cityCols);
      let density = 1e6;
      for (let s of slots)
        density = Math.min(density, densityIn(s));
      if (density > rng4() * 0.3) {
        let r = 30 + rng4(10);
        if (!rng4(10))
          r *= 1.2;
        r = Math.min(18, r);
        height = Math.min(density * 300, 3 + density * 20 * (8 + rng4(10)));
        let simple = rng4(4) != 0;
        if (simple)
          height /= 2;
        let building = roundTower2(rng4, r * (0.5 + rng4() * 0.5), i, height / r, simple);
        r *= 1 - (0.1 + extend[X] + extend[Y]);
        buildings[i] = building;
        heights[i] = height;
        building.extend = extend;
        building.height = height;
        building.density = density;
        for (let s of slots)
          heights[s] = height;
        let poiH = height + rng4() * 10 + 30;
        building.verts.push({at: [0, 0, poiH - 1], ind: building.verts.length});
        building.verts.push({at: [0, 0, poiH], ind: building.verts.length});
      }
    }
    return buildings;
  }
  function tunnelCity(buildings) {
    let pois = [];
    for (let i = 0; i < citySize; i++) {
      let b = buildings[i];
      if (!b)
        continue;
      let a = i % cityCols / cityCols * PI2 + b.extend[X] / 2;
      let matrix = multiply;
      if (b.extend[X] > 1 || b.extend[Y] > 1)
        ts(b, scalingv([b.extend[X] + 1, b.extend[Y] + 1, 1]));
      ts(b, translation([0, i / citySize * cityDepth + cityRowGap * b.extend[Y] / 2, -cityRadius]), axisRotation(axis[Y], a));
    }
    return pois;
  }
  var HM = 0;
  var VM = 1;
  function generateWindows(rng4) {
    let gaps = [rng4(6) + 2, rng4(6) + 2, rng4(6), rng4(6)];
    let windowDensity = [(rng4() + 0.3) / 4, rng4() + 0.3];
    return [gaps, windowDensity];
  }
  function generateBuildingCurve(rng4, height, r, simple = false) {
    let [x, y] = [1, 0];
    let curve = [[x * r, 0]];
    let types = [];
    let w = 2, b = 0;
    let [gaps, windowDensity] = generateWindows(rng4);
    while (y < height) {
      let dx = w > 1 ? 0 : x * (0.1 + rng4() * 0.5) * (rng4(4) ? -1 : 1);
      if (x + dx > 1 || x + dx < 0.3)
        dx = -dx;
      let dy = simple ? height : (w > 0 ? 1 : 0) * (rng4() * 0.5 * (height * 1.1 - y));
      if (y < 5 && dy > 0)
        dy++;
      x += dx;
      y += dy;
      if (y > height)
        y = height;
      curve.push([x * r, y * r]);
      let cols = ~~(dy * windowDensity[0] * r) || 1;
      let rows = ~~(x * windowDensity[1] * r) || 1;
      let windowArea = (1 - gaps[HM] / 15) * (1 - gaps[VM] / 15);
      if (dx != 0)
        cols = 1;
      types.push([
        BUILDING,
        cols * 256 + rows,
        hexFromDigits(gaps),
        windowArea * 256
      ]);
      let nw = rng4(3);
      w = nw == 0 && w == 0 ? 2 : nw;
    }
    curve.push([0, y * r]);
    types.push([BUILDING, 2056, 57344, 0]);
    return [curve, types];
  }
  function generateShipPart(rng4, bends, bounds, curve) {
    let sides = [rng4() * bounds[Y][0], rng4() * bounds[Y][1]];
    let x = bounds[0][X];
    let slices = [[[x, sides[X]]], [[x, sides[Y]]]];
    let step = (bounds[X][1] - bounds[X][0]) / (bends[0] + bends[1]);
    if (step < 0)
      return;
    for (let i = 0; i < 20; i++) {
      x = x + rng4() * step * 2;
      if (x > bounds[X][1])
        x = bounds[X][1];
      if (rng4() < bends[0] / (bends[0] + bends[1]))
        sides[0] = rng4() * bounds[Y][0];
      if (rng4() < bends[1] / (bends[0] + bends[1]))
        sides[1] = rng4() * bounds[Y][1];
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
  function shipGeometry(rng4, id) {
    let hullLength = 5 + rng4(15);
    let hullWidth = 0.5 + rng4();
    let hullHeight = 0.5 + rng4();
    let wingWidth = 0.1 + rng4() * 3;
    let wing1 = generateShipPart(rng4, [rng4(4) + 1, rng4(4) + 1], [[0, hullWidth + 1 + rng4(5)], [-2 - rng4() * hullLength / 3, 6 + rng4() * hullLength / 2]], [[1, 0], [1.5, wingWidth * 0.33], [1.5, wingWidth * 0.66], [1, wingWidth]]);
    let wing2 = clone(wing1);
    reflect(wing2, [1, 0, 0]);
    let body = generateShipPart(rng4, [rng4(3) + 1, rng4(3) + 1], [[-3, hullLength], [-4 * hullHeight, 4 * hullHeight]], [[1, -2 * hullWidth], [1.5, -1 * hullWidth], [1.5, 1 * hullWidth], [1, 2 * hullWidth]]);
    ts(body, axisRotation([0, 0, -1], PIH), axisRotation([0, 1, 0], PIH));
    let ship = combine2([body, wing1, wing2]);
    for (let v4 of ship.verts)
      v4.type = [SHIP, id, 0, 0];
    return ship;
  }

  // src/shaders/fMain.glsl
  var fMain_default = "in vec3 vcell;\nin vec3 vat;\nin float dist;\n\nflat in float light;\nflat in vec3 vnorm;\nflat in vec4 vcolor;\n\nflat in ivec4 vtype;\n\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\n\nfloat hexDigitF(int n, int place) {\n  return float((n >> (place * 4)) & 15) / 15.;\n}\n\nint hex2Digit(int n, int place) {\n  return (n >> (place * 8)) % 256;\n}\n\nvoid main() {\n  int itype = vtype.x;\n  int t1 = vtype.y;\n  int t2 = vtype.z;\n  float bright = light;\n  if(itype == 2) {\n    float hm = hexDigitF(t2, 0);\n    float vm = hexDigitF(t2, 1);\n    float x = fract(vcell.x);\n    float y = fract(vcell.y);\n\n    float far = 0., near = 0.;\n\n    if(dist >= 500.) {\n      far = x > hm &&\n        x < 1. - hm &&\n        y > vm &&\n        y < 1. - vm ? -float(vtype.a) / 256. : .0;\n    }\n\n    if(dist <= 700.) {\n      float cols = float(hex2Digit(t1, 1));\n      float rows = float(hex2Digit(t1, 0));\n      float hb = hexDigitF(t2, 2);\n      float vb = hexDigitF(t2, 3);\n      near = x > hm &&\n        x < 1. - hm &&\n        y > vm &&\n        y < 1. - vm &&\n        (cols == 1. || fract((x - hm) / (1. - hm * 2.) * cols) > hb) &&\n        (rows == 1. || fract((y - vm) / (1. - vm * 2.) * rows) > vb) ? -1. : .0;\n    }\n\n    float l = clamp((dist - 500.) / 200., 0., 1.);\n    bright += mix(near, far, l);\n\n  } else if(itype == 4) {\n    bright += vat.z * 5e-4 + (fract(vat.y / 40. + 0.55) < .1 || fract(atan(vat.x, vat.z) / 3.141 * 36. + 0.45) < .1 ? -1. : 0.);\n  } else if(itype == 5) {\n    bright = 2.;\n  }\n\n  if(itype == 7) {\n    float y = fract(vcell.y);\n    bright += y < 0.03 || y > 0.97 || y>0.49 && y<0.51? -.5 : .0;\n  }\n\n  if(bright > 0.)\n    bright += vcell.y * 0.05 - 0.3;\n\n  c0 = vec4(vcolor.rgb * bright, vcolor.a);\n  c1 = vec4(vnorm*0.5+0.5, gl_FragCoord.z * gl_FragCoord.w);\n}\n";

  // src/shaders/fScreen.glsl
  var fScreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\nuniform mat4 invCamera;\nuniform mat4 invPerspective;\nuniform mat4 flyer;\nuniform vec3 viewSize;\nuniform vec3 scp0;\nuniform vec3 scp1;\nuniform vec3 scp2;\nuniform float timeout;\n\nin vec2 uv;\n\nout vec4 color;\n\nfloat Noise2d(in vec2 x) {\n  float xhash = cos(x.x * 37.0);\n  float yhash = cos(x.y * 57.0);\n  return fract(415.92653 * (xhash + yhash));\n}\n\nint b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);\n\nfloat dither(float v, ivec2 F) {\n  return v * 75. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;\n}\n\nconst bool ditherOn = true;\nconst float collisionDepth = 0.6;\n\nvoid main() {\n\n  ivec2 F = ivec2(gl_FragCoord.xy);\n\n  float depth = texelFetch(Depth, F, 0).r;\n  color = vec4(1.);\n\n  vec4 screenPos = vec4(uv.x, -uv.y, depth * 2. - 1., 1.);\n\n  vec4 pos4 = invCamera * screenPos;\n  vec3 pos = (pos4 / pos4.w).xyz - flyer[3].xyz;\n\n  color = texelFetch(T0, F, 0);\n\n  float r = 75.;\n  bool ui = false;\n\n  vec2 cntr = vec2(viewSize.x-r-10., viewSize.y - r-10.);\n  vec2 dif = cntr - gl_FragCoord.xy;\n  float l = length(dif);\n  if(l < r) {\n    float a = atan(-dif.x, dif.y);\n    if(l>r*.7 && l<r && timeout > 0.){\n      ui = true;\n      color.xyz = a / 6.282 + 0.5 > timeout ? vec3(.01):vec3(1.);\n    }\n  }\n\n  if(depth == 1. && !ui) {\n\n    vec3 pos1 = pos / length(pos);\n\n    if(Noise2d(vec2(floor((pos1.x + pos1.y) * 3e2), floor(pos1.z * 3e2))) > 0.99)\n      color.xyz = pos1 * 0.5 + 0.5;\n    else\n      color.xyz = vec3(0.);\n\n  } else {\n\n    if(color.r > 0.)\n      color = (color * 2. + texelFetch(T0, F + ivec2(1, 0), 0) + texelFetch(T0, F + ivec2(0, 1), 0)) * 0.25;\n\n    float diff = 0.;\n    for(int i = 0; i < 8; i++) {\n      int step = i / 4;\n      ivec2 place = ivec2(i % 2, i % 4 / 2) * step;\n      float edge = texelFetch(Depth, F + place, 0).r +\n        texelFetch(Depth, F - place, 0).r - depth * 2.;\n      diff += abs(edge);\n    }\n\n    diff *= depth;\n\n    if(diff > .00007) {\n      color.rgb = normalize(color.rgb) * 0.3;\n    } else {\n      if(ditherOn) {\n        color.r = dither(color.r, F);\n        color.g = dither(color.g, F);\n        color.b = dither(color.b, F);\n      }\n    }\n\n    if(depth > 0.995 && (depth - 0.99) * 1000. > float(b64[F.y % 8 * 8 + F.x % 8])) {\n      color = vec4(1.);\n    }\n  }\n\n  //color = texelFetch(T1, F, 0);\n  color.a = 1.;\n}";

  // src/shaders/vScreenQuad.glsl
  var vScreenQuad_default = "out vec2 uv;\n\nvoid main() {\n  int i = gl_VertexID;\n  ivec2 uvi = ivec2(i % 2, (i + 1) % 4 / 2) * 2 - 1;\n  gl_Position = vec4(uvi.x, uvi.y, 0, 1);\n  uv = vec2(uvi);\n}";

  // src/shaders/vMain.glsl
  var vMain_default = "uniform mat4 camera;\r\nuniform mat4 flyer;\r\nuniform vec3 sun;\r\nuniform float time;\r\nuniform int consuming;\r\nuniform float consumingStage;\r\n\r\nuniform int liveDebris[32];\r\n\r\nin vec3 at;\r\nin vec3 up;\r\nin vec3 norm;\r\nin vec3 cell;\r\nin vec4 type;\r\nin float shape;\r\n\r\nout vec3 vcell;\r\nout vec3 vat;\r\nout float dist;\r\nflat out float light;\r\n\r\nflat out vec3 vnorm;\r\nflat out vec4 vcolor;\r\n\r\nflat out ivec4 vtype;\r\nflat out int vshape;\r\n\r\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\r\n\r\nmat4 axisRotation(vec3 axis, float angle) {\r\n\r\n  float x = axis.x;\r\n  float y = axis.y;\r\n  float z = axis.z;\r\n\r\n  float n = sqrt(x * x + y * y + z * z);\r\n  x /= n;\r\n  y /= n;\r\n  z /= n;\r\n  float c = cos(angle);\r\n  float s = sin(angle);\r\n  float omc = 1. - c;\r\n\r\n  return mat4(x * x + (1. - x * x) * c, x * y * omc + z * s, x * z * omc - y * s, 0., x * y * omc - z * s, y * y + (1. - y * y) * c, y * z * omc + x * s, 0., x * z * omc + y * s, y * z * omc - x * s, z * z + (1. - z * z) * c, 0., 0., 0., 0., 1.);\r\n}\r\n\r\nvoid main() {\r\n  vat = at;\r\n  vnorm = norm;\r\n  vcell = cell;\r\n\r\n  vtype = ivec4(type);\r\n  vshape = int(shape);\r\n\r\n  vec4 at4 = vec4(at+up*0., 1.);\r\n\r\n  vcolor.rgb = vec3(1.);\r\n\r\n  if(vtype.x == 9) {\r\n    int swarm = vshape/32;\r\n    bool live = (liveDebris[swarm/30] & (1 << swarm%30)) != 0;\r\n    if(live || consuming == swarm){\r\n      vcolor.rgb = vec3(1.,0.,1.);\r\n      float a = rand(shape);\r\n      vec3 axis = normalize(vec3(rand(a+1.), rand(a+2.), rand(a+3.)));\r\n      light -= a*0.3; \r\n      mat4 rot = axisRotation(axis, time * 5. * (.5+rand(a+4.)) + rand(a+4.) );\r\n      vnorm = normalize((rot * vec4(norm, 1.)).xyz);\r\n      at4 = rot * at4;\r\n      at4.xyz += 25. * (vec3(rand(a+5.), rand(a+6.), rand(a+7.)) - .5);\r\n      at4.xyz += vec3(vtype.yzw);\r\n      at4.xyz += up * sin(float(swarm) + time*0.1) * 20.;\r\n      if(consuming == swarm)\r\n        at4.xyz = mix(at4.xyz, flyer[3].xyz, consumingStage);\r\n    } else {\r\n      at4 = vec4(1e6);\r\n    }\r\n  }\r\n\r\n  if(vtype.x == 3) {\r\n    at4 = flyer * at4;\r\n    mat4 fnorm = flyer;\r\n    fnorm[3] = vec4(0.);\r\n    vnorm = normalize((fnorm * vec4(norm, 1.)).xyz);\r\n  }\r\n\r\n  if(vtype.x == 7) {\r\n    int id = vtype.y;\r\n    if(id % 2 == 0) {\r\n      vnorm.y = -vnorm.y;\r\n      at4.y = -at4.y;\r\n    }\r\n    float shift = fract(fract(float(id) / 1e2) + time * 1e-2 * (id % 2 == 1 ? 3. : -3.));\r\n    at4.y = at4.y + 7300. - pow(shift * 120., 2.);\r\n    if(at4.y<0.){\r\n      at4.xz += vec2(rand(float(id))-.5,rand(float(id+1))-.5) * pow(at4.y/1e2,2.) ;\r\n    }\r\n  }\r\n\r\n  vec4 pos;\r\n\r\n  if(vtype.x == 8) {\r\n    pos = at4;\r\n  } else {\r\n    pos = camera * at4;\r\n  }\r\n\r\n  vat = at4.xyz;\r\n  pos.y = -pos.y;\r\n\r\n  vec3 toSun = sun - vat;\r\n  light = dot(vnorm, normalize(toSun)) * 0.2 + .9 - length(toSun) * 1e-6;\r\n\r\n  if(vtype.x == 7) {\r\n    light += 0.2;\r\n  }\r\n\r\n  dist = distance(vat, flyer[3].xyz);\r\n\r\n  gl_Position = pos;\r\n}\r\n";

  // src/shaders.ts
  var shaders = {fMain: fMain_default, vMain: vMain_default, fScreen: fScreen_default, vScreenQuad: vScreenQuad_default};
  var shaders_default = shaders;

  // src/sound.ts
  var ax;
  var sampleRate = 44100;
  var volume = 1;
  function init() {
    ax = ax || new window.AudioContext();
  }
  function soundBuf(samples) {
    const buffer = ax.createBuffer(samples.length, samples[0].length, sampleRate);
    samples.forEach((d, i) => buffer.getChannelData(i).set(d));
    return buffer;
  }
  function playBuf(buffer, loop = false) {
    const source = ax.createBufferSource();
    source.buffer = buffer;
    let gain = ax.createGain();
    gain.gain.value = 0;
    gain.connect(ax.destination);
    source.connect(gain);
    source.loop = loop;
    source.start();
    return gain;
  }
  var brown = (freq = 0.02, vol = 0.1) => {
    let bl = 0;
    return () => {
      var white = Math.random() * 2 - 1;
      let v4 = (bl + freq * white) / (1 + freq);
      bl = v4;
      v4 *= vol / freq;
      return v4;
    };
  };
  var key = (n) => 2 ** (n / 12) * 440;
  var tone;
  function playNoise() {
    tone = soundBuf([rangef(2e5, brown(0.02, 0.01))]);
    return playBuf(tone, true);
  }
  var rng = RNG(Math.random());
  function node(note, dur = 3, vol = 1) {
    if (!ax)
      return;
    let [o, g] = og();
    g.gain.setValueAtTime(volume * vol * 44 / key(note), ax.currentTime);
    o.frequency.setValueAtTime(key(note), ax.currentTime);
    g.gain.exponentialRampToValueAtTime(1e-5, ax.currentTime + dur);
    o.stop(ax.currentTime + dur);
  }
  function og(type = "sine") {
    let o = ax.createOscillator();
    let g = ax.createGain();
    o.type = type;
    o.connect(g);
    o.start();
    g.connect(ax.destination);
    return [o, g];
  }

  // src/game.ts
  var rad = Math.PI / 180;
  var InitialRot = [90, 0];
  var mouseDelta = [0, 0];
  var gs = {};
  var MaxTimeout = 10;
  var Radius = 0;
  var Acceleration = 1;
  var Turning = 2;
  var Timeout = 3;
  var ComboStart = 4;
  var Durability = 5;
  var UpgradeNames = [
    "Extend collection radius",
    "Accelerate and brake faster",
    "Turn faster",
    "Longer combo timer",
    "Bigger starting combo multiplier",
    "Less combo loss on collisions"
  ];
  var liveDebris = new Int32Array(32);
  function init2() {
    Object.assign(gs, {
      dir: [1, 0, 0],
      at: [0, -300, 0],
      vel: 0.05,
      time: 0,
      drot: [0, 0],
      smoothDrot: [0, 0],
      rot: InitialRot,
      consuming: -1,
      consumingStage: 0,
      debris,
      liveDebris,
      debrisLeft: 0,
      combo: 0,
      timeout: 0,
      timeoutSpeed: 0,
      speedBonus: 0,
      score: 0,
      upgrades: [0, 0, 0, 0, 0, 0],
      points: 0,
      level: 0
    });
    for (let d of gs.debris) {
      let live = rng2(2);
      d.live = live ? true : false;
    }
    updateLiveDebris();
    return gs;
  }
  var rng2 = RNG(1);
  function update(dTime) {
    gs.time += dTime;
    while (scoreForNextLevel() <= gs.score) {
      notify("LEVEL UP!", 2);
      gs.level++;
      gs.points++;
      for (let i = 0; i < 12; i++)
        setTimeout(() => node(i), i * 100);
    }
    if (dTime > rng2()) {
      let d = gs.debris[rng2(gs.debris.length)];
      d.live = !d.live;
      updateLiveDebris();
    }
    if (gs.combo > 0)
      gs.timeout -= (1 + gs.timeoutSpeed) * dTime;
    if (gs.timeout <= 0 || gs.combo <= 0) {
      gs.timeout = 0;
      gs.timeoutSpeed = 0;
      gs.combo = 0;
    }
    let velDelta = ((keyPressed[0] ? 1 : 0) + (keyPressed[2] ? -1 : 0)) * dTime * (0.15 + gs.upgrades[Acceleration] * 0.1);
    gs.vel += Math.max(velDelta, -gs.vel);
    gs.speedBonus = Math.min(gs.speedBonus + dTime / 10, gs.vel);
    mouseDelta = mouseDelta.map((d) => Math.sign(d) * Math.min(30, Math.abs(d) * dTime * 6e4));
    gs.drot[X] = gs.drot[X] - mouseDelta[X] * 0.1;
    gs.drot[Y] = Math.max(-89.999, Math.min(89.999, gs.drot[1] - mouseDelta[1] * 0.1));
    let turn = Math.min(1, dTime * (7 + gs.upgrades[Turning] * 3));
    gs.smoothDrot = gs.smoothDrot.map((prevSmooth, i) => prevSmooth * (1 - turn) + gs.drot[i] * turn);
    gs.rot = sum22(gs.rot, gs.smoothDrot, 6e-3);
    gs.rot[Y] = Math.max(-89, Math.min(gs.rot[Y], 89));
    gs.smoothDrot = scale2(gs.smoothDrot, 1 - turn * 0.2);
    let [yaw, pitch] = gs.rot.map((v4) => v4 * rad);
    gs.dir = norm([
      Math.cos(pitch) * Math.cos(yaw),
      Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch)
    ]);
    mouseDelta = [0, 0];
    let delta = scale(gs.dir, gs.vel * dTime * 1e3);
    gs.at = sum(gs.at, delta);
    gs.debris.forEach((d, i) => {
      let at = sum(d.at, scale(d.up, Math.sin(d.ind + gs.time * 0.1) * 20));
      if (d.live && dist(at, gs.at) < 30 + gs.upgrades[Radius] ** 0.4 * 10) {
        consume(d);
      }
    });
    if (gs.consuming > -1) {
      gs.consumingStage = gs.consumingStage + dTime * 10;
      if (gs.consumingStage > 1) {
        gs.consuming = -1;
      }
    }
    const checkCollisions = true;
    if (checkCollisions) {
      for (let crashPoint in [0, 1, 2]) {
        let proximity = crashPixel[crashPoint][3];
        if (proximity > 10) {
          let raw = [...crashPixel[crashPoint].slice(0, 3)];
          let norm2 = norm(sumn(raw, -128));
          let crashAngle = -mul(norm2, gs.dir);
          let damage = crashAngle * gs.vel;
          console.log("DAMAGE", damage);
          damage -= gs.upgrades[Durability] * 0.05;
          if (damage > 0) {
            gs.combo -= damage;
            gs.timeout -= damage;
          }
          if (crashAngle > 0) {
            node(rng2(20) - 60, crashAngle * 10, crashAngle ** 2);
            gs.at = sumvn(gs.at, norm2, gs.vel * crashAngle * proximity / 2);
            gs.vel *= 1 - Math.min(1, crashAngle * 0.03);
          }
        }
      }
    }
  }
  function consume(d) {
    d.live = false;
    let gain = ~~(d.score * comboMultiplier() * speedMultiplier() * cleanCityMultiplier());
    notify(gain.toFixed());
    node(rng2(20) - 30 + gs.combo);
    gs.consuming = d.ind;
    gs.consumingStage = 0;
    gs.combo += 1;
    gs.timeoutSpeed += 0.1 / (1 + 0.3 * gs.upgrades[Timeout]);
    gs.timeout = MaxTimeout;
    gs.score += gain;
    updateLiveDebris();
  }
  var keyPressed = [];
  function initControls() {
    ["keydown", "keyup", "mousedown", "mouseup", "mousemove"].forEach((t) => document.addEventListener(t, (e) => {
      switch (e.type) {
        case "mousemove":
          mouseDelta = sum2(mouseDelta, [e.movementX, e.movementY]);
          break;
        case "mousedown":
          keyPressed[e.button] = true;
          break;
        case "mouseup":
          keyPressed[e.button] = false;
          break;
      }
    }));
  }
  function updateLiveDebris() {
    gs.debrisLeft = 0;
    gs.liveDebris.fill(0);
    for (let d of gs.debris) {
      if (d.live) {
        gs.liveDebris[~~(d.ind / 30)] += 1 << d.ind % 30;
        gs.debrisLeft++;
      }
    }
    if (gs.time > 1)
      saveToSlot(0);
  }
  function relativeTimeout() {
    return gs.timeout / MaxTimeout;
  }
  function comboMultiplier() {
    return ~~(10 + ~~(gs.upgrades[ComboStart] * 3.334) + gs.combo) / 10;
  }
  function cleanCityMultiplier() {
    return ~~(MaxDebris / gs.debrisLeft * 5) / 10;
  }
  function speedMultiplier() {
    return 1 + 0.1 * ~~(gs.speedBonus ** 2 * 100);
  }
  function save() {
    let save2 = {...gs};
    delete save2.liveDebris;
    save2.debris = save2.debris.map((d) => d.live ? 1 : 0).join("");
    save2.date = new Date().toLocaleString();
    return JSON.stringify(save2);
  }
  function load(s) {
    if (!s)
      return;
    let liveDebris2 = gs.liveDebris, debris2 = gs.debris;
    Object.assign(gs, JSON.parse(s));
    gs.debris.split().forEach((v4, i) => debris2[i].live = v4 == "1");
    gs.liveDebris = liveDebris2;
    gs.debris = debris2;
    updateLiveDebris();
  }
  function scoreForNextLevel() {
    return (gs.level + 1) * (gs.level + 2) * 500;
  }

  // src/render.ts
  var pMain;
  var pScreen;
  var pMainUniform;
  var pScreenUniform;
  var textures2;
  var framebuffer2;
  var viewSize;
  var cx2d;
  var notifications = [];
  var smoothScore = 0;
  var O;
  function notify(text, importance = 1) {
    notifications.push({text, at: [viewSize[X] * (Math.random() * 0.2 + 0.4), viewSize[Y] / 2], importance});
  }
  function init3(size) {
    let C = document.getElementById("C");
    let D = document.getElementById("D");
    O = document.getElementById("O");
    viewSize = size;
    C.width = D.width = viewSize[X];
    C.height = D.height = viewSize[Y];
    O.style.marginTop = D.style.marginTop = `${-viewSize[Y]}px`;
    C.style.width = D.style.width = O.style.width = `${viewSize[X]}px`;
    C.style.height = D.style.height = O.style.height = `${viewSize[Y]}px`;
    context(C);
    cx2d = D.getContext("2d");
    cx2d.fillStyle = "#fff";
    pMain = compile(shaders_default.vMain, shaders_default.fMain);
    pMainUniform = uniforms(pMain);
    pScreen = compile(shaders_default.vScreenQuad, shaders_default.fScreen);
    pScreenUniform = uniforms(pScreen);
    textures2 = textures([TEX_RGBA, TEX_RGBA, TEX_DEPTHS], viewSize);
    framebuffer2 = framebuffer(textures2);
    return [C, O];
  }
  var crashPoints = [[-0.8, 1, -1], [0.8, 1, -1], [0, 1, -1]];
  var rng3 = RNG(1);
  function write(text, x, y) {
    cx2d.fillText(text, x, y);
    cx2d.strokeText(text, x, y);
  }
  function frame(gs2, [bufs, elements], [bufsF, elementsF], dTime) {
    cx2d.clearRect(0, 0, viewSize[X], viewSize[Y]);
    if (gs2.combo) {
      cx2d.textAlign = "center";
      cx2d.font = "bold 32pt sans-serif";
      write(`x${comboMultiplier().toFixed(1)}`, viewSize[X] - 85, 100);
      smoothScore = Math.min(gs2.score, smoothScore + Math.max((gs2.score - smoothScore) / 10, dTime * 10));
      write(`${smoothScore.toFixed()}`, viewSize[X] / 2, 40);
      cx2d.textAlign = "right";
      cx2d.font = "bold 16pt Courier";
      write(`speed`, viewSize[X] - 10, 200);
      write(`clean city`, viewSize[X] - 10, 250);
      cx2d.font = "bold 20pt Courier";
      write(`x${speedMultiplier().toFixed(1)}`, viewSize[X] - 10, 220);
      write(`x${cleanCityMultiplier().toFixed(1)}`, viewSize[X] - 10, 270);
    }
    cx2d.font = "bold 32pt Courier";
    for (let n of notifications) {
      write(n.text, n.at[X], n.at[Y]);
      n.at[Y] -= dTime * 300 / (n.importance || 1);
    }
    let time = gs2.time;
    let [camera, perspective2, look] = viewMatrices(sum(sum(gs2.at, scale(gs2.dir, -5)), [0, 0, 0]), gs2.dir, viewSize, PI / 4, [4, cityDepth + dist2(gs2.at, [0, cityDepth * 0.5, 0])]);
    let invCamera = inverse(camera);
    let flyer = lookTo(gs2.at, gs2.dir, [0, 0, 1]);
    flyer = multiply(flyer, axisRotation([0, 0, 1], -gs2.smoothDrot[X] * Math.PI / 4 / 100));
    flyer = multiply(flyer, axisRotation([1, 0, 0], -gs2.smoothDrot[Y] * Math.PI / 4 / 200));
    let screenCrashPoints = crashPoints.map((p) => {
      let a = transform(camera, transform(flyer, p));
      a[X] = ~~((a[X] * 0.5 + 0.5) * viewSize[X]);
      a[Y] = ~~((0.5 - a[Y] * 0.5) * viewSize[Y]);
      a[Z] = 0;
      return a;
    });
    let startTime = Date.now();
    gl.useProgram(pMain);
    setUniforms(pMainUniform, {
      camera,
      flyer,
      sun: [0, cityDepth, 0],
      time,
      "liveDebris[0]": gs2.liveDebris,
      consuming: gs2.consuming,
      consumingStage: gs2.consumingStage
    });
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer2);
    gl.clear(DEPTH_BUFFER_BIT | COLOR_BUFFER_BIT);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    setUniforms(pMainUniform, {pass: 0});
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);
    setAttrDatabuffers(bufs, pMain);
    gl.drawElements(TRIANGLES, elements.faces.length, UNSIGNED_INT, 0);
    checkCrash(screenCrashPoints);
    setUniforms(pMainUniform, {pass: 1});
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufsF.faces);
    setAttrDatabuffers(bufsF, pMain);
    gl.drawElements(TRIANGLES, elementsF.faces.length, UNSIGNED_INT, 0);
    gl.useProgram(pScreen);
    setUniforms(pScreenUniform, {
      invCamera,
      flyer,
      time,
      invPerspective: inverse(perspective2),
      timeout: relativeTimeout(),
      viewSize: [viewSize[X], viewSize[Y], 0],
      scp0: screenCrashPoints[0],
      scp1: screenCrashPoints[1],
      scp2: screenCrashPoints[2]
    });
    bindTextures(textures2, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    gl.drawArrays(TRIANGLES, 0, 6);
    gl.flush();
  }
  var crashPixel = rangef(4, (_) => new Uint8Array(4));
  async function checkCrash(screenCrashPoints) {
    gl.readBuffer(COLOR_ATTACHMENT1);
    await Promise.all(rangef(3, (n) => readPixelsAsync(screenCrashPoints[n][X], screenCrashPoints[n][Y], 1, 1, RGBA, UNSIGNED_BYTE, crashPixel[n])));
  }
  function renderUI(gs2) {
    if (!gs2) {
      O.style.visibility = "hidden";
      return;
    }
    O.style.visibility = "visible";
    let saves = [];
    for (let slot = 0; slot < 10; slot++) {
      let save2 = localStorage["warpStation13K-" + slot];
      if (!save2 && slot > 0)
        break;
      let parsed = save2 ? JSON.parse(save2) : {};
      saves.push(`${parsed.score || "0"}pts ${parsed.date || ""}`);
    }
    if (saves.length < 10)
      saves.push("New Save");
    O.innerHTML = `
  <H1>Warp Station 13K</H1>
  <p>Score: ${gs2.score}/${scoreForNextLevel()} Level: ${gs2.level} Upgrade points: ${gs2.points}</p>
  <H3>Upgrades</H3>
    ${UpgradeNames.map((v4, i) => `
      <span class="u">${v4}</span>
      <button id="down_${i}">-</button>
      <span class="up">${gs2.upgrades[i]}</span>
      <button id="up_${i}">+</button><br/>`).join("")}
  <H3>Saves</H3>
  <button id="new">New Game</button><br/><br/>
  ${saves.map((v4, i) => `
  <div>    
    <button style="visibility:${i != 0 ? "" : "hidden"}" id="save_${i}">Save</button>
    <span class="si">${i ? i : "Auto"}</span>
    <span class="st">${v4}</span>    
    <button style="visibility:${v4 != "New Save" ? "" : "hidden"}" id="load_${i}" class="lb">Load</button>
    </div>
  `).join("")}`;
  }

  // src/prog.ts
  var noiseGain;
  var noiseVol = 1;
  var attributes = {at: [3], norm: [3], cell: [3], type: [4], shape: [1], up: [3]};
  function main() {
    const viewSize2 = [1200, 800];
    let startTime = Date.now();
    let [world, flyer] = initGeometry();
    let [C, O2] = init3(viewSize2);
    initControls();
    let gs2 = init2();
    let [bufs, elements] = putShapesInElementBuffers(world, attributes);
    let [bufsF, elementsF] = putShapesInElementBuffers(flyer, attributes);
    console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);
    let t = 0;
    function update2(dTime) {
      update(dTime);
      frame(gs2, [bufs, elements], [bufsF, elementsF], dTime);
      if (noiseGain) {
        noiseGain.gain.value = gs2.vel * noiseVol * 0.7;
        if (dTime * gs2.vel * 10 > Math.random()) {
          noiseVol = 0.5 + Math.random();
        }
        noiseVol = noiseVol * (1 - dTime) + dTime;
      }
      t++;
    }
    let started = false;
    C.onclick = (e) => {
      togglePlaying(true);
      if (!started) {
        init();
        noiseGain = playNoise();
        let lastTime = Date.now();
        const loop = () => {
          if (playing())
            update2((Date.now() - lastTime) / 1e3);
          lastTime = Date.now();
          requestAnimationFrame(loop);
        };
        loop();
      }
      started = true;
    };
    O2.onclick = (e) => {
      let id = e.target.id;
      let [cmd, n] = id.split("_");
      switch (cmd) {
        case "up":
          if (gs2.points > 0) {
            gs2.upgrades[n]++;
            gs2.points--;
          }
          break;
        case "down":
          if (gs2.upgrades[n] > 0) {
            gs2.upgrades[n]--;
            gs2.points++;
          }
          break;
        case "save":
          saveToSlot(n);
          break;
        case "load":
          loadSlot(n);
          renderUI(null);
          update2(0);
          setTimeout(() => togglePlaying(true), 10);
          break;
        case "new":
          init2();
          renderUI(null);
          update2(0);
          setTimeout(() => togglePlaying(true), 10);
          break;
      }
      renderUI(gs2);
    };
    document.onkeydown = (e) => {
      switch (e.code) {
        case "Space":
          togglePlaying();
          break;
        case "KeyS":
          saveToSlot(0);
          break;
        case "KeyL":
          loadSlot(0);
          break;
      }
    };
    function playing() {
      return document.pointerLockElement == C;
    }
    function togglePlaying(on) {
      if (on == null)
        on = !playing();
      if (on) {
        C.requestPointerLock();
        renderUI(null);
      } else {
        document.exitPointerLock();
        if (noiseGain)
          noiseGain.gain.value = 0;
        renderUI(gs2);
      }
    }
    loadSlot(0);
    update2(0);
    togglePlaying(false);
  }
  var settings = localStorage.warpStation13K || {slot: 0};
  function saveToSlot(slot) {
    localStorage["warpStation13K-" + slot] = save();
  }
  function loadSlot(slot) {
    load(localStorage["warpStation13K-" + slot]);
  }
  main();
})();
