(() => {
  // src/g0/misc.ts
  var X = 0;
  var Y = 1;
  var Z = 2;
  var arr = (n) => [...new Array(n)].map((_, i) => i);
  var arrm = (n, f) => [...new Array(n)].map((_, i) => f ? f(i) : i);
  var PI2 = Math.PI * 2;
  var PIH = Math.PI / 2;
  var PIQ = Math.PI / 4;
  function RNG(seed) {
    if (0 < seed && seed < 1)
      seed = ~~(seed * 1e9);
    let rngi = (n) => {
      return (seed = seed * 16807 % 2147483647) % n;
    };
    let rng = (n) => {
      return n == -1 ? seed : n == null ? rngi(1e9) / 1e9 : rngi(n);
    };
    return rng;
  }
  function dictMap(a, f) {
    let res = {};
    for (let k in a)
      res[k] = f(a[k], k, a);
    return res;
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
  var scale2 = (v4, n) => v4.map((x) => x * n);
  var sum2 = (v4, w) => v4.map((x, i) => x + w[i]);
  var sum22 = (v4, w, n) => v4.map((x, i) => x + w[i] * n);
  var angle2d = (a) => [Math.cos(a), Math.sin(a)];
  var lerp = (v4, w, n) => v4.map((x, i) => x * (1 - n) + w[i] * n);

  // src/g0/m4.ts
  var UP = axis[Y];
  var identity = arr(16).map((i) => i % 5 ? 0 : 1);
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
  var scaling = (n) => arr(16).map((i) => i == 15 ? 1 : i % 5 ? 0 : n);
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
  function camera(at, dir, [width, height]) {
    const fov = 50 * Math.PI / 180;
    const aspect = width / height;
    const zNear = 5;
    const zFar = 2e3;
    const look = lookAt(at, sum(at, dir), axis[Z]);
    const mPerspective = perspective(fov, aspect, zNear, zFar);
    const mCamera = multiply(mPerspective, inverse(look));
    return mCamera;
  }

  // src/g0/shape.ts
  var defaultAttrs = {at: 3, norm: 3, cell: 3};
  function calculateFlatNormals(s) {
    for (let f of s.faces) {
      if (f[2].norm == null || Number.isNaN(f[2].norm[X]))
        f[2].norm = norm(cross(sub(f[1].at, f[2].at), sub(f[0].at, f[2].at)));
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
  function addUp(arr3) {
    let total = 0;
    return [0, ...arr3.map((el) => total += el.length)];
  }
  function flat(arr3, makeArray = (n) => new Array(n)) {
    const numEl = addUp(arr3);
    let flattened = makeArray(numEl[arr3.length]);
    let skip;
    for (let i = arr3.length - 1; i >= 0; i--) {
      skip = i == 0 ? 0 : numEl[i];
      for (let j = arr3[i].length - 1; j >= 0; j--)
        flattened[skip + j] = arr3[i][j];
    }
    return flattened;
  }
  function shapesToElements(shapes, attrs) {
    let l = shapes.length;
    let faceCount = addUp(shapes.map((s) => s.faces));
    let vertCount = addUp(shapes.map((s) => s.verts));
    let faces = new Uint32Array(faceCount[l] * 3);
    let verts = dictMap(attrs, (v4) => new Float32Array(vertCount[l] * v4));
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
      let size = attrs[bufName];
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
  var biRevolutionShader = (sectors, a) => (x) => angle2d(PI2 / sectors * (x + (x % 2 ? a : 0)));
  var towerShader = (slice, curve) => (x, y) => {
    return [
      slice[x % slice.length][X] * curve[y][X],
      slice[x % slice.length][Y] * curve[y][X],
      curve[y][Y]
    ];
  };
  var towerMesh = (slice, curve) => mesh(slice.length, curve.length - 1, towerShader(slice, curve));
  var smoothPoly = (curve, gap) => flat(curve.map((v4, i) => {
    let w = curve[(i + 1) % curve.length];
    return [lerp(v4, w, gap), lerp(v4, w, 1 - gap)];
  }));

  // src/g0/glconst.ts
  var DEPTH_BUFFER_BIT = 256;
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
  function attr(program, name, buffer, itemSize = 3) {
    let loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(loc, itemSize, FLOAT, false, 0, 0);
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
  function setDatabuffers(buffers, elements2) {
    setDatabuffer(buffers.faces, elements2.faces, ELEMENT_ARRAY_BUFFER);
    for (let k in elements2.verts)
      setDatabuffer(buffers.verts[k], elements2.verts[k]);
  }
  function setAttrDatabuffers(buffers, prog) {
    for (let key in buffers.verts)
      attr(prog, key, buffers.verts[key], buffers.attrs[key]);
  }
  function putShapesInElementBuffers(shapes, attrs) {
    let elements2 = shapesToElements(shapes, attrs);
    let bufs2 = createDatabuffers(attrs);
    setDatabuffers(bufs2, elements2);
    return [bufs2, elements2];
  }

  // src/geometry.ts
  var ts = transformShape;
  function putWorldnBuffers(world2, pMain3) {
    let [bufs2, elements2] = putShapesInElementBuffers(world2, {at: 3, norm: 3, cell: 3, type: 1, shape: 1});
    setAttrDatabuffers(bufs2, pMain3);
    return [bufs2, elements2];
  }
  function initGeometry() {
    let world2 = generateCity();
    let tunnel = tunnelGeometry(20, 400, 440, 2e3);
    for (let v4 of tunnel.verts)
      v4.type = 4;
    ts(tunnel, axisRotation(axis[X], -Math.PI / 2));
    world2.push(tunnel);
    let flyer = flyerGeometry();
    world2.push(flyer);
    calculateAllNormals(world2);
    return world2;
  }
  function flyerGeometry() {
    let wing = towerMesh(smoothPoly([[0, -4], [10, -5], [0, 3], [-10, -5]], 0.1), [[0, 0], [0.8, 0], [1, 0.5], [1, 1], [0.8, 1.5], [0, 1.5]]);
    ts(wing, translation([0, 13, 5]));
    let body = towerMesh(smoothPoly([[3, -4], [0, 10], [-3, -4]], 0.2), [[0, 1], [0.8, 1], [1, 2], [1, 3], [0.4, 4], [0, 4]]);
    ts(body, translation([0, 12, 4]));
    let flyer = combine([body, wing]);
    for (let v4 of flyer.verts)
      v4.type = 3;
    ts(flyer, scaling(0.25), axisRotation([0, -1, 0], Math.PI), axisRotation([-1, 0, 0], Math.PI / 2), translation([0, 3, 0]));
    return flyer;
  }
  function generateCity() {
    let shapes = [];
    let rng = RNG(1);
    function generate() {
      for (let i = 0; i < 1e4; i++) {
        let r = rng() * 15 + 5;
        let [curve, types] = generateBuildingCurve(r, rng);
        let sectors = (rng(4) + 2) * 2;
        let building = towerMesh(arrm(sectors, (a) => sum2(biRevolutionShader(sectors, rng())(a), [1, 0])), curve);
        for (let v4 of building.verts) {
          v4.type = types[v4.cell[Y]];
          v4.shape = i;
        }
        shapes.push(building);
      }
    }
    const generateBuildingCurve = (r, rng2) => {
      let [x, y] = [r, 0];
      let curve = [[0, 0], [x, 0]];
      let types = [0];
      let w = 2;
      while (rng2(3) || curve.length < 4) {
        let mx = w <= 1 ? 0.8 - rng2() * 0.4 : 1;
        let dy = w * x * 2.5 * (rng2() + 0.3) ** 2;
        x *= mx;
        y += dy;
        curve.push([x, y]);
        types.push(mx > 0.5 && dy ? 2 : 0);
        w = rng2(3);
      }
      curve.push([0, y + (rng2(4) - 1) * x]);
      return [curve, types];
    };
    function calculateGeometry() {
      generate();
      tunnelCity(shapes, rng);
    }
    calculateGeometry();
    return shapes;
  }
  function calculateAllNormals(shapes) {
    for (let p of shapes)
      calculateFlatNormals(p);
  }
  function tunnelCity(shapes, rng) {
    for (let i = 0; i < shapes.length; i++) {
      let a = i / 1e3 + rng();
      ts(shapes[i], axisRotation(axis[Z], rng() * 6), translation([0, 20 * (i % 100 + 1), -400]), axisRotation(axis[Y], a));
    }
  }
  function tunnelGeometry(divs, r1, r2, h) {
    return towerMesh(arrm(divs, (i) => angle2d(i / (divs - 1) * PI2)), [[r1, 0], [r2, 0], [r2, h], [r1, h], [r1, 0]]);
  }

  // src/shaders/fMain.glsl
  var fMain_default = "uniform float t;\nuniform vec3 sun;\n\nin vec3 vcell;\nin vec3 vat;\n\nflat in vec3 vnorm;\nflat in float vtype;\nflat in float vshape;\nflat in vec4 vcolor;\n\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\n\nvoid main() {\n  float light = dot(vnorm, sun)*0.5+.5;\n  if(vtype == 2.)\n    light += fract(vcell.y)>0.1 && fract(vcell.y)<0.9 && fract(vcell.x)>0.1 && fract(vcell.x)<0.9 && fract(vcell.y*10.)>0.3 && fract(vcell.x*10.)>0.3?-1.:.0;\n  if(light>0.)\n    light += vcell.y*0.05 - 0.3;\n  /*if(mod(vcell.x,0.2)<0.1 != mod(vcell.y,0.2)<0.1)\n    light /= 2.;*/\n  //c0 = vec4(light, 0., 0., 1.);\n  c0 = vec4(vcolor.rgb * light, vcolor.a);\n  //c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);\n  c1 = vec4(vat/1000. + 0.5, 0);\n}\n";

  // src/shaders/fScreen.glsl
  var fScreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\n\nout vec4 color;\n\nint b16[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);\nint b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);\n\nfloat dither(float v, ivec2 F) {\n  return v * 75. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;\n}\n\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  float depth = texelFetch(Depth, F, 0).r;\n  color = vec4(0.);\n\n  if(depth == 1.) {\n    //c = vec4(texelFetch(T1, F, 0).rgb, 1.);\n    color = vec4(1., 1., 1., 1.);\n  } else {\n    color = texelFetch(T0, F, 0);\n\n    float diff = 0.;\n    for(int i = 0; i < 8; i++) {\n      int step = i / 4;\n      float edge = texelFetch(Depth, F + ivec2(i % 2, i % 4 / 2) * step, 0).r + texelFetch(Depth, F - ivec2(i % 2, i % 4 / 2) * step, 0).r - depth * 2.;\n      diff += abs(edge);\n    }\n\n    if(diff > .00007) {\n      //lut = lit>0.1?0.:1.;\n      color.rgb = normalize(color.rgb) * 0.3;\n    } else {\n      color.r = dither(color.r, F);\n      color.g = dither(color.g, F);\n      color.b = dither(color.b, F);\n      //lit = lit * 15. > float(b16[F.y % 4 * 4 + F.x % 4]) ? 1. : 0.;\n      //lut = lit;\n    }\n\n    if(depth > 0.99 && (depth - 0.99) * 2000. > float(b64[F.y % 8 * 8 + F.x % 8])) {\n      color = vec4(1.);\n    }\n\n    /*if(depth > 0.99){\n      color.rgb += (depth - 0.99) * 10.;\n    }*/\n\n\n  }\n\n  //c.rgb = texelFetch(T0, F, 0).rgb;\n\n  /*if(texelFetch(T1, F, 0).r == 1.)\n    c.rgb = vec3(0., 0., 1.);*/\n  color.a = 1.;\n}";

  // src/shaders/vScreenQuad.glsl
  var vScreenQuad_default = "void main() {\n  int i = gl_VertexID;\n  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders/vMain.glsl
  var vMain_default = "uniform mat4 camera;\r\nuniform mat4 flyer;\r\n\r\nin vec3 at;\r\nin vec3 norm;\r\nin vec3 cell;\r\nin float type;\r\nin float shape;\r\n\r\nout vec3 vcell;\r\nout vec3 vat;\r\n\r\nflat out vec3 vnorm;\r\nflat out float vtype;\r\nflat out float vshape;\r\nflat out vec4 vcolor;\r\n\r\nvoid main() {\r\n  vat = at;\r\n  vnorm = norm;\r\n  vcell = cell;\r\n  vtype = type;\r\n  vshape = shape;\r\n\r\n  vec4 pos = vec4(at, 1.);\r\n\r\n  //int si = int(shape);\r\n\r\n  if(shape > 0.)\r\n    //vcolor.rgb = vec3(shape/10000., mod(shape,100.)/100., mod(shape,10.)/10.) * 1.5;\r\n    vcolor.rgb = vec3(1.);\r\n  else\r\n    vcolor.rgb = vec3(.9);\r\n  //color = vec4(1., 1., 0., 1.);\r\n\r\n  if(floor(type) == 3. ){\r\n    pos = flyer * pos;\r\n    mat4 fnorm = flyer;\r\n    fnorm[3] = vec4(0.);\r\n    vnorm = (fnorm * vec4(norm,1.)).xyz;\r\n  }\r\n\r\n  pos = camera * pos;\r\n  pos.y = -pos.y;\r\n\r\n  gl_Position = pos;\r\n}";

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
    let C2 = document.getElementById("C");
    viewSize = size;
    C2.width = viewSize[X];
    C2.height = viewSize[Y];
    context(C2);
    pMain = compile(shaders_default.vMain, shaders_default.fMain);
    pMainUniform = uniforms(pMain);
    pScreen = compile(shaders_default.vScreenQuad, shaders_default.fScreen);
    pScreenUniform = uniforms(pScreen);
    textures2 = textures([TEX_RGBA, TEX_RGBA, TEX_DEPTHS], viewSize);
    framebuffer2 = framebuffer(textures2);
    return [pMain, C2];
  }
  function frame(state3, [bufs2, elements2]) {
    let camera2 = camera(sum(sum(state3.pos, scale(state3.dir, -5)), [0, 0, 0]), state3.dir, viewSize);
    let fdir = [...state3.dir];
    let flyer = lookTo(state3.pos, state3.dir, [0, 0, 1]);
    flyer = multiply(flyer, axisRotation([0, 0, 1], -state3.smoothDrot[X] * Math.PI / 4 / 100));
    flyer = multiply(flyer, axisRotation([1, 0, 0], -state3.smoothDrot[Y] * Math.PI / 4 / 200));
    let startTime2 = Date.now();
    gl.useProgram(pMain);
    pMainUniform.camera(camera2);
    pMainUniform.flyer(flyer);
    pMainUniform.sun(norm([1, 1, -1]));
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer2);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.clear(DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs2.faces);
    gl.drawElements(TRIANGLES, elements2.faces.length, UNSIGNED_INT, 0);
    gl.useProgram(pScreen);
    bindTextures(textures2, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    gl.drawArrays(TRIANGLES, 0, 6);
    gl.flush();
  }

  // src/game.ts
  var rad = Math.PI / 180;
  var heightToSpeed = 0;
  var friction = 0;
  var InitialRot = [90, 0];
  var mouseDelta = [0, 0];
  var state;
  var tilt = 0;
  function init2() {
    state = {
      dir: [1, 0, 0],
      pos: [0, -300, 0],
      vel: 0.05,
      time: 0,
      drot: [0, 0],
      smoothDrot: [0, 0],
      rot: InitialRot
    };
    return state;
  }
  function update(dTime) {
    mouseDelta = mouseDelta.map((d) => Math.sign(d) * Math.min(30, Math.abs(d) * dTime * 60));
    state.drot[X] = state.drot[X] - mouseDelta[X] * 0.1;
    state.drot[Y] = Math.max(-89.999, Math.min(89.999, state.drot[1] - mouseDelta[1] * 0.1));
    let turn = Math.min(1, dTime * 0.01);
    state.smoothDrot = state.smoothDrot.map((prevSmooth, i) => prevSmooth * (1 - turn) + state.drot[i] * turn);
    state.rot = sum22(state.rot, state.smoothDrot, 6e-3);
    state.smoothDrot = scale2(state.smoothDrot, 1 - turn * 0.1);
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
    state.vel -= delta[2] * heightToSpeed;
    state.pos = sum(state.pos, delta);
  }
  function initControls() {
    ["keydown", "keyup", "mousedown", "mouseup", "mousemove"].forEach((t2) => document.addEventListener(t2, (e) => {
      switch (e.type) {
        case "mousemove":
          mouseDelta = sum2(mouseDelta, [e.movementX, e.movementY]);
          break;
      }
    }));
  }

  // src/prog.ts
  var viewSize2 = [1600, 900];
  var startTime = Date.now();
  var world = initGeometry();
  var [pMain2, C] = init(viewSize2);
  initControls();
  var state2 = init2();
  var [bufs, elements] = putWorldnBuffers(world, pMain2);
  console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);
  var t = 0;
  var paused = false;
  function update2(dTime) {
    if (paused)
      return;
    update(dTime);
    frame(state2, [bufs, elements]);
    t++;
  }
  update2(0);
  var started = false;
  window.onclick = (e) => {
    togglePause(false);
    if (!started) {
      let lastTime = Date.now();
      const loop = () => {
        update2(Date.now() - lastTime);
        lastTime = Date.now();
        requestAnimationFrame(loop);
      };
      loop();
    }
    console.log(e);
    started = true;
  };
  document.onkeydown = (e) => {
    switch (e.code) {
      case "Space":
        togglePause();
        break;
    }
  };
  function togglePause(on) {
    paused = on == null ? !paused : on;
    if (paused)
      document.exitPointerLock();
    else
      C.requestPointerLock();
  }
})();
