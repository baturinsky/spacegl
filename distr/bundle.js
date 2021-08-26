(() => {
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

  // src/g0/misc.ts
  var X = 0;
  var Y = 1;
  var Z = 2;
  var arr = (n) => [...new Array(n)].map((_, i) => i);
  var PI2 = Math.PI * 2;
  function RNG(seed) {
    if (0 < seed && seed < 1)
      seed = ~~(seed * 1e9);
    let rngi = (n) => {
      return ~~(Math.sin(++seed) ** 2 * 1e9 % n) * (n < 0 ? -1 : 1);
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
  var len = (v4) => (v4[0] * v4[0] + v4[1] * v4[1] + v4[2] * v4[2]) ** 0.5;
  var scale = (v4, n) => [v4[0] * n, v4[1] * n, v4[2] * n];
  var norm = (v4, l = 1) => scale(v4, l / len(v4));
  var sub = (v4, w) => [v4[0] - w[0], v4[1] - w[1], v4[2] - w[2]];
  var cross = (a, b) => [a[Y] * b[Z] - a[Z] * b[Y], a[Z] * b[X] - a[X] * b[Z], a[X] * b[Y] - a[Y] * b[X]];
  var angle2d = (a) => [Math.cos(a), Math.sin(a)];

  // src/g0/m4.ts
  var UP = axis[Y];
  var multiply = (a, b) => a.map((_, n) => {
    let col = n % 4, row4 = n - col;
    return b[row4] * a[col] + b[row4 + 1] * a[col + 4] + b[row4 + 2] * a[col + 8] + b[row4 + 3] * a[col + 12];
  });
  var add = (a, b) => a.map((x, i) => x + b[i]);
  var scale2 = (m3, n) => m3.map((x) => n * x);
  var trace = (a) => a[0] + a[5] + a[10] + a[15];
  var sum = (a, b, ...args) => {
    const v4 = scale2(b, a);
    return args.length ? add(v4, sum(...args)) : v4;
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
    let total = sum((trA * trA * trA - 3 * trA * trAA + 2 * trAAA) / 6, identity, -(trA * trA - trAA) / 2, A, trA, AA, -1, AAA);
    return scale2(total, 1 / det);
  }
  var identity = arr(16).map((n) => n % 5 ? 0 : 1);
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
  var perspective = (fieldOfViewYInRadians, aspect2, zNear2, zFar2) => {
    const f = 1 / Math.tan(0.5 * fieldOfViewYInRadians);
    const rangeInv = 1 / (zNear2 - zFar2);
    return [
      f / aspect2,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (zNear2 + zFar2) * rangeInv,
      -1,
      0,
      0,
      zNear2 * zFar2 * rangeInv * 2,
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
  function transform(m3, v4) {
    const [v0, v1, v22] = v4;
    const d = v0 * m3[0 * 4 + 3] + v1 * m3[1 * 4 + 3] + v22 * m3[2 * 4 + 3] + m3[3 * 4 + 3];
    return [
      (v0 * m3[0 * 4 + 0] + v1 * m3[1 * 4 + 0] + v22 * m3[2 * 4 + 0] + m3[3 * 4 + 0]) / d,
      (v0 * m3[0 * 4 + 1] + v1 * m3[1 * 4 + 1] + v22 * m3[2 * 4 + 1] + m3[3 * 4 + 1]) / d,
      (v0 * m3[0 * 4 + 2] + v1 * m3[1 * 4 + 2] + v22 * m3[2 * 4 + 2] + m3[3 * 4 + 2]) / d
    ];
  }
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

  // src/g0/shape.ts
  var defaultAttrs = {at: 3, norm: 3, uv: 3};
  function calculateFlatNormals(s) {
    for (let f of s.faces) {
      if (f[2].norm == null || Number.isNaN(f[2].norm[X]))
        f[2].norm = norm(cross(sub(f[1].at, f[2].at), sub(f[0].at, f[2].at)));
    }
  }
  var transformShape = (mat, shape3) => {
    for (let vert of shape3.verts)
      vert.at = transform(mat, vert.at);
  };
  function addUp(arr2) {
    let total = 0;
    return [0, ...arr2.map((el) => total += el.length)];
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
      if (size == 1)
        shapes.forEach((shape3, shapei) => {
          for (let vert of shape3.verts)
            if (vert[bufName])
              buf[i++] = vert[bufName];
        });
      else
        shapes.forEach((shape3, shapei) => {
          for (let vert of shape3.verts) {
            if (vert[bufName])
              buf.set(vert[bufName], i * size);
            i++;
          }
        });
    }
    return {faces, verts};
  }
  function mesh(cols, rows, shader2) {
    let faces = new Array(cols * rows * 2), verts = new Array((cols + 1) * (rows + 1));
    let verticeCols = cols + 1;
    for (let x = 0; x <= cols; x++)
      for (let y = 0; y <= rows; y++)
        verts[y * verticeCols + x] = {at: shader2(x, y), uv: [x, y, 0], ind: y * verticeCols + x};
    for (let x = 0; x < cols; x++)
      for (let y = 0; y < rows; y++) {
        const fi = 2 * (y * cols + x);
        const vi = y * verticeCols + x;
        faces[fi] = [verts[vi + 1 + verticeCols], verts[vi + verticeCols], verts[vi]];
        faces[fi + 1] = [verts[vi + 1], verts[vi + 1 + verticeCols], verts[vi]];
      }
    return {faces, verts};
  }
  var revolutionShader = (curve, sectors) => towerShader(arr(sectors).map((x) => angle2d(PI2 / sectors * x)), curve);
  var biRevolutionShader = (curve, sectors, a) => towerShader(arr(sectors).map((x) => angle2d(PI2 / sectors * (x + (x % 2 ? a : 0)))), curve);
  var towerShader = (slice, curve) => (x, y) => {
    return [slice[x % slice.length][X] * curve[y][X], slice[x % slice.length][Y] * curve[y][X], curve[y][Y]];
  };
  var generateCurve = (rng) => {
    let [x, y] = [rng() * 2 + 0.5, 0];
    let c = [[0, 0]];
    let w = 2;
    while (rng(5) || c.length == 0) {
      c.push([x, y]);
      if (w <= 1)
        x *= 0.9 - rng() * 0.4;
      if (w >= 1)
        y += (rng() + 0.1) ** 2 * 2 * x;
      w = rng(5);
    }
    c.push([0, y]);
    return c;
  };

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
  function texture(width2, height2, format, source) {
    const texture2 = gl.createTexture();
    gl.bindTexture(TEXTURE_2D, texture2);
    gl.texImage2D(TEXTURE_2D, 0, format[2] || format[1], width2, height2, 0, format[1], format[0], source);
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
  function textures(formats, [width2, height2]) {
    return formats.map((format) => texture(width2, height2, format));
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
          gl[`uniform${args.length}${suffix}`](loc, ...args);
        };
    }
    console.log(u);
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

  // src/shaders/fMain.glsl
  var fMain_default = "uniform float t;\nuniform vec3 sun;\n\nflat in vec3 normal;\nin vec3 fuv;\n\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\n\nvoid main() {\n  float light = dot(normal, sun)*0.5+.5;\n  light += fract(fuv.y)>0.1 && fract(fuv.y)<0.9 && fract(fuv.x)>0.1 && fract(fuv.x)<0.9 && fract(fuv.y*10.)>0.3 && fract(fuv.x*10.)>0.3?-1.:.0;\n  /*if(mod(uv.x,0.2)<0.1 != mod(uv.y,0.2)<0.1)\n    light /= 2.;*/\n  c0 = vec4(vec3(light), 1.);\n  c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);\n}\n";

  // src/shaders/fScreen.glsl
  var fScreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\n\nout vec4 c;\n\nint b16[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);\nint b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);\n\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  c = vec4(0.);\n  float depth = texelFetch(Depth, F, 0).r;\n  float lut;\n\n  if(depth == 1.) {\n    lut = 1.;\n  } else {\n    float lit = texelFetch(T0, F, 0).r;\n\n    float diff = 0.;\n    for(int i = 0; i < 8; i++) {\n      int step = i/4;\n      float edge = texelFetch(Depth, F + ivec2(i % 2, i % 4 / 2)*step, 0).r + texelFetch(Depth, F - ivec2(i % 2, i % 4 / 2)*step, 0).r - depth * 2.;\n      diff += abs(edge);\n    }\n\n    if(diff > .00007) {\n      //lut = lit>0.1?0.:1.;\n      lut = 0.;\n    } else {\n      lut = lit * 65. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;\n      //lut = lit * 15. > float(b16[F.y % 4 * 4 + F.x % 4]) ? 1. : 0.;\n      //lut = lit;\n    }\n  }\n\n  c.rgb = vec3(lut);\n\n  //c.rgb = texelFetch(T0, F, 0).rgb;\n\n  /*if(texelFetch(T1, F, 0).r == 1.)\n    c.rgb = vec3(0., 0., 1.);*/\n  c.a = 1.;\n}";

  // src/shaders/vScreenQuad.glsl
  var vScreenQuad_default = "void main() {\n  int i = gl_VertexID;\n  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders/vMain.glsl
  var vMain_default = "uniform mat4 camera;\r\n\r\nin vec3 at;\r\nin vec3 norm;\r\nin vec3 uv;\r\n\r\nout vec3 fuv;\r\nflat out vec3 normal;\r\n\r\nvoid main() {\r\n  vec4 glpos = camera * vec4(at, 1.);\r\n  glpos.y = -glpos.y;\r\n  gl_Position = glpos / glpos.w;\r\n  //int i = gl_VertexID % 6;\r\n  //uv = vec2(foo[i * 2], foo[i * 2 + 1]);\r\n  fuv = uv;\r\n  normal = norm;\r\n}";

  // src/shaders.ts
  var shaders = {fMain: fMain_default, vMain: vMain_default, fScreen: fScreen_default, vScreenQuad: vScreenQuad_default};
  var shaders_default = shaders;

  // src/prog.ts
  var width = 1600;
  var height = 800;
  var C = document.getElementById("C");
  C.width = width;
  C.height = height;
  context(C);
  var startTime = Date.now();
  var pMain = compile(shaders_default.vMain, shaders_default.fMain);
  var pMainUniform = uniforms(pMain);
  var pScreen = compile(shaders_default.vScreenQuad, shaders_default.fScreen);
  var pScreenUniform = uniforms(pScreen);
  var textures2 = textures([TEX_RGBA, TEX_RGBA, TEX_DEPTHS], [width, height]);
  var framebuffer2 = framebuffer(textures2);
  var t = 0;
  var fov = 50 * Math.PI / 180;
  var aspect = width / height;
  var zNear = 2;
  var zFar = 200;
  var look = lookAt([0, -20, 30], [0, 30, 0], [0, 0, 1]);
  var mPerspective = perspective(fov, aspect, zNear, zFar);
  var mCamera = multiply(mPerspective, inverse(look));
  var world = generateCity();
  var divs = 20;
  var r = 5;
  var ball = mesh(divs, divs, revolutionShader(arr(divs + 1).map((row) => {
    let a = row / divs * Math.PI;
    let [x, y] = [Math.sin(a) * r, Math.sin(a - Math.PI / 2) * r + 15];
    console.log(row, a, x, y);
    return [x, y];
  }), divs));
  world.push(ball);
  calculateAllNormals(world);
  var {bufs, elements} = putShapesInElementBuffers(world, defaultAttrs);
  console.log(bufs, elements);
  console.log(`${Date.now() - startTime} ms ${elements.faces.length} faces`);
  setAttrDatabuffers(bufs, pMain);
  function loop() {
    startTime = Date.now();
    gl.useProgram(pMain);
    pMainUniform.camera(mCamera);
    pMainUniform.sun(...norm([-1, 1, -1]));
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer2);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.clear(DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);
    gl.drawElements(TRIANGLES, elements.faces.length, UNSIGNED_INT, 0);
    gl.useProgram(pScreen);
    bindTextures(textures2, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    gl.drawArrays(TRIANGLES, 0, 6);
    t++;
    gl.flush();
    console.log(`Rendered in ${Date.now() - startTime} ms`);
  }
  window.onclick = loop;
  loop();
  function generateCity() {
    let shapes = [];
    let rng = RNG(1);
    function generate() {
      for (let i = 0; i < 1e4; i++) {
        let curve = generateCurve(rng);
        let sectors = (~~rng(5) + 3) * 2;
        shapes.push(mesh(sectors, curve.length - 1, biRevolutionShader(curve, sectors, 0.7)));
      }
    }
    function transformShapes() {
      for (let i = 0; i < 1e4; i++) {
        let s = shapes[i];
        let mat = multiply(translation([i % 100 - 50, i / 30, 0]), axisRotation([0, 0, 1], rng() * 6));
        transformShape(mat, s);
      }
    }
    function calculateGeometry() {
      generate();
      transformShapes();
    }
    calculateGeometry();
    return shapes;
  }
  function calculateAllNormals(shapes) {
    for (let p of shapes)
      calculateFlatNormals(p);
  }
  function putShapesInElementBuffers(shapes, attrs) {
    let elements2 = shapesToElements(shapes, attrs);
    let bufs2 = createDatabuffers(attrs);
    setDatabuffers(bufs2, elements2);
    return {bufs: bufs2, elements: elements2};
  }
})();
