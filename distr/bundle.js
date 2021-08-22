(() => {
  // src/g0/glconst.js
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
  function texture(width2, height2, format, source) {
    const texture2 = gl.createTexture();
    gl.bindTexture(TEXTURE_2D, texture2);
    gl.texImage2D(TEXTURE_2D, 0, format[2] || format[1], width2, height2, 0, format[1], format[0], source);
    texture2["fmt"] = format;
    gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
    gl.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST);
    gl.bindTexture(TEXTURE_2D, null);
    return texture2;
  }
  function framebuffer(textures2) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(FRAMEBUFFER, fb);
    for (let i = 0; i < textures2.length; i++) {
      let format = textures2[i]["fmt"] && textures2[i]["fmt"][1];
      let attachment = format == DEPTH_STENCIL ? DEPTH_STENCIL_ATTACHMENT : format == DEPTH_COMPONENT ? DEPTH_ATTACHMENT : COLOR_ATTACHMENT0 + i;
      gl.framebufferTexture2D(FRAMEBUFFER, attachment, TEXTURE_2D, textures2[i], 0);
    }
    gl.bindFramebuffer(FRAMEBUFFER, null);
    return fb;
  }
  function bindTextures(textures2, uniforms2) {
    for (let i = 0; i < textures2.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      uniforms2[i] && uniforms2[i](i);
      gl.bindTexture(TEXTURE_2D, textures2[i]);
    }
  }
  function uniforms(p) {
    const uniform = {};
    const types = {[INT]: "i", [UNSIGNED_INT]: "ui", [FLOAT]: "f", [FLOAT_MAT4]: "Matrix4fv"};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
      const info = gl.getActiveUniform(p, i);
      console.log(info.name, info.type.toString(16));
      let suffix = types[info.type] || "i";
      const loc = gl.getUniformLocation(p, info.name);
      if (suffix.indexOf("Matrix") >= 0)
        uniform[info.name] = (...args) => gl[`uniform${suffix}`](loc, false, ...args);
      else
        uniform[info.name] = (...args) => gl[`uniform${args.length}${suffix}`](loc, ...args);
    }
    console.log(uniform);
    return uniform;
  }
  function databuffer() {
    return gl.createBuffer();
  }
  function setDatabuffer(buffer, data, bindingPoint = ARRAY_BUFFER) {
    gl.bindBuffer(bindingPoint, buffer);
    gl.bufferData(bindingPoint, data, STATIC_DRAW);
  }
  function attr(program, name, buffer, itemSize = 3) {
    let loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(loc, itemSize, FLOAT, false, 0, 0);
  }

  // src/g0/misc.ts
  var X = 0;
  var Y = 1;
  var Z = 2;
  var arr = (n) => [...new Array(n)].map((_, i) => i);
  var FACE = 0;
  var VERT = 1;
  var NORM = 2;
  var ETC = 3;
  var GEOCHANNELS = [0, 1, 2, 3];
  var PI2 = Math.PI * 2;
  function calculateNormals(s) {
    s[NORM] = new Array(s[VERT].length);
    for (let i = 0; i < s[FACE].length; i++) {
      let verts = s[FACE][i].map((v2) => s[VERT][v2]);
      s[NORM][s[FACE][i][2]] = norm(cross(sub(verts[1], verts[0]), sub(verts[2], verts[0])));
    }
  }
  var transformShape = (mat, shape) => shape.map((arr3, channel) => channel == VERT ? arr3.map((v2) => transform(mat, v2)) : arr3);
  function shapesToBuffers(shapes) {
    let l = shapes.length;
    let count = new Array(l + 1);
    count[0] = [0, 0];
    for (let i = 0; i < l; i++) {
      count[i + 1] = count[i].map((v2, j) => v2 + shapes[i][j].length);
    }
    let bufs2 = [
      new Uint32Array(count[l][FACE] * 3),
      new Float32Array(count[l][VERT] * 3),
      new Float32Array(count[l][VERT] * 3),
      new Float32Array(count[l][VERT] * 4)
    ];
    shapes.forEach((shape, shapei) => {
      for (let slayer in shape) {
        let layer = ~~slayer;
        shape[layer].forEach((el, i) => {
          if (layer == FACE)
            el = addn(el, count[shapei][VERT]);
          bufs2[layer].set(el, (count[shapei][layer == FACE ? FACE : VERT] + i) * (layer == ETC ? 4 : 3));
        });
      }
    });
    return bufs2;
  }
  function mesh(w, h, shader2) {
    let face = [], vert = [], etc = [];
    let cols = w + 1;
    for (let x = 0; x <= w; x++) {
      for (let y = 0; y <= h; y++) {
        let vi = y * cols + x;
        vert[vi] = shader2(x, y);
        etc[vi] = [x, y, 0, 0];
        if (x < w && y < h) {
          const fi = 2 * (y * w + x);
          face[fi] = [vi + 1 + cols, vi + cols, vi];
          face[fi + 1] = [vi + 1, vi + 1 + cols, vi];
        }
      }
    }
    return [face, vert, null, etc];
  }
  var revolutionShader = (curve, sectors) => (x, y) => {
    let a = angle2d(PI2 / sectors * x);
    return [a[X] * curve[y][X], a[Y] * curve[y][X], curve[y][Y]];
  };
  var generateCurve = (rng2) => {
    let [x, y] = [rng2() * 2, 0];
    let c = [[0, 0]];
    let w = 1;
    while (rng2(5) || c.length == 0) {
      c.push([x, y]);
      if (w == 1)
        x *= 0.9 - rng2() * 0.4;
      if (w != 0)
        y += rng2() ** 2 * 2 * x;
      w = rng2(4);
    }
    c.push([0, y]);
    return c;
  };
  function RNG(seed) {
    if (0 < seed && seed < 1)
      seed = ~~(seed * 1e9);
    let rngi = (n) => {
      return ~~(Math.sin(++seed) ** 2 * 1e9 % n) * Math.sign(n);
    };
    let rng2 = (n) => {
      return n == -1 ? seed : n == null ? rngi(1e9) / 1e9 : rngi(n);
    };
    return rng2;
  }

  // src/g0/v3.ts
  var axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var len = (v2) => Math.hypot(v2[0], v2[1], v2[2]);
  var scale = (v2, n) => [v2[0] * n, v2[1] * n, v2[2] * n];
  var norm = (v2, l = 1) => scale(v2, l / len(v2));
  var addn = (v2, n) => [v2[0] + n, v2[1] + n, v2[2] + n];
  var sub = (v2, w) => [v2[0] - w[0], v2[1] - w[1], v2[2] - w[2]];
  var cross = (a, b) => [a[Y] * b[Z] - a[Z] * b[Y], a[Z] * b[X] - a[X] * b[Z], a[X] * b[Y] - a[Y] * b[X]];
  var angle2d = (a) => [Math.cos(a), Math.sin(a)];

  // src/g0/m4.ts
  var UP = axis[Y];
  var multiply = (a, b) => a.map((_, n) => arr(4).reduce((s, i) => s + b[n - n % 4 + i] * a[n % 4 + i * 4], 0));
  var add = (a, b) => a.map((x, i) => x + b[i]);
  var scale2 = (m3, n) => m3.map((x) => n * x);
  var trace = (a) => a[0] + a[5] + a[10] + a[15];
  var sum = (a, b, ...args) => {
    const v2 = scale2(b, a);
    return args.length ? add(v2, sum(...args)) : v2;
  };
  function inverse(A) {
    const AA = multiply(A, A);
    const AAA = multiply(A, AA);
    const AAAA = multiply(AA, AA);
    const trA = trace(A);
    const trAA = trace(AA);
    const trAAA = trace(AAA);
    const trAAAA = trace(AAAA);
    const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
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
  function transform(m3, v2) {
    const [v0, v1, v22] = v2;
    const d = v0 * m3[0 * 4 + 3] + v1 * m3[1 * 4 + 3] + v22 * m3[2 * 4 + 3] + m3[3 * 4 + 3];
    return [
      (v0 * m3[0 * 4 + 0] + v1 * m3[1 * 4 + 0] + v22 * m3[2 * 4 + 0] + m3[3 * 4 + 0]) / d,
      (v0 * m3[0 * 4 + 1] + v1 * m3[1 * 4 + 1] + v22 * m3[2 * 4 + 1] + m3[3 * 4 + 1]) / d,
      (v0 * m3[0 * 4 + 2] + v1 * m3[1 * 4 + 2] + v22 * m3[2 * 4 + 2] + m3[3 * 4 + 2]) / d
    ];
  }
  var translation = (v2) => [
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
    v2[X],
    v2[Y],
    v2[Z],
    1
  ];

  // src/shaders/fMain.glsl
  var fMain_default = "uniform float t;\n\nflat in vec3 normal;\nin vec4 uv;\n\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\n\nvoid main() {\n  float light = dot(normal, normalize(vec3(-1.,-2.,3.))) + 0.5;\n  light += fract(uv.y)>0.1 && fract(uv.y)<0.9 && fract(uv.x)>0.1 && fract(uv.x)<0.9 && fract(uv.y*10.)>0.3 && fract(uv.x*10.)>0.3?-1.:.0;\n  /*if(mod(uv.x,0.2)<0.1 != mod(uv.y,0.2)<0.1)\n    light /= 2.;*/\n  c0 = vec4(vec3(light), 1.);\n  c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);\n}\n";

  // src/shaders/fScreen.glsl
  var fScreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\n\nout vec4 c;\n\nint b16[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);\nint b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);\n\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  c = vec4(0.);\n  float depth = texelFetch(Depth, F, 0).r;\n  float lut;\n\n  if(depth == 1.) {\n    lut = 1.;\n  } else {\n    float lit = texelFetch(T0, F, 0).r;\n\n    float diff = 0.;\n    for(int i = 0; i < 8; i++) {\n      int step = i/4;\n      float edge = texelFetch(Depth, F + ivec2(i % 2, i % 4 / 2)*step, 0).r + texelFetch(Depth, F - ivec2(i % 2, i % 4 / 2)*step, 0).r - depth * 2.;\n      diff += abs(edge);\n    }\n\n    if(diff > .00007) {\n      //lut = lit>0.1?0.:1.;\n      lut = 0.;\n    } else {\n      lut = lit * 65. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;\n      //lut = lit * 15. > float(b16[F.y % 4 * 4 + F.x % 4]) ? 1. : 0.;\n      //lut = lit;\n    }\n  }\n\n  c.rgb = vec3(lut);\n\n  //c.rgb = texelFetch(T0, F, 0).rgb;\n\n  /*if(texelFetch(T1, F, 0).r == 1.)\n    c.rgb = vec3(0., 0., 1.);*/\n  c.a = 1.;\n}";

  // src/shaders/vScreenQuad.glsl
  var vScreenQuad_default = "void main() {\n  int i = gl_VertexID;\n  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders/vMain.glsl
  var vMain_default = "uniform mat4 camera;\r\n\r\nin vec3 vert;\r\nin vec3 norm;\r\nin vec4 etc;\r\n\r\nout vec4 uv;\r\nflat out vec3 normal;\r\n\r\nvoid main() {\r\n  vec4 glpos = camera * vec4(vert, 1.);\r\n  glpos.y = -glpos.y;\r\n  gl_Position = glpos / glpos.w;\r\n  //int i = gl_VertexID % 6;\r\n  //uv = vec2(foo[i * 2], foo[i * 2 + 1]);\r\n  uv = etc;\r\n  normal = norm;\r\n}";

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
  var pp = [];
  var rng = RNG(1);
  function generate() {
    for (let i = 0; i < 1e4; i++) {
      let curve = generateCurve(rng);
      let sectors = ~~rng(10) + 3;
      pp.push(mesh(sectors, curve.length - 1, revolutionShader(curve, sectors)));
    }
  }
  function transformShapes() {
    pp = pp.map((p) => {
      let mat = multiply(translation([rng(200) - 100, rng(100), 0]), axisRotation([0, 0, 1], rng() * 6));
      return transformShape(mat, p);
    });
  }
  function calculateAllNormals() {
    pp.forEach((p) => calculateNormals(p));
  }
  function setDatabuffers() {
    setDatabuffer(bufs[FACE], arrays[FACE], ELEMENT_ARRAY_BUFFER);
    bufs.forEach((buf, channel) => {
      if (channel != FACE)
        setDatabuffer(buf, arrays[channel]);
      ;
    });
  }
  generate();
  transformShapes();
  calculateAllNormals();
  var arrays = shapesToBuffers(pp);
  var bufs = GEOCHANNELS.map((i) => databuffer());
  setDatabuffers();
  console.log(`${Date.now() - startTime} ms ${arrays[1].length / 3} faces`);
  var textures = [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map((tex) => texture(width, height, tex));
  var framebuffer2 = framebuffer(textures);
  var t = 0;
  var fov = 50 * Math.PI / 180;
  var aspect = width / height;
  var zNear = 2;
  var zFar = 200;
  var look = lookAt([0, -20, 20], [0, 30, 0], [0, 0, 1]);
  var perspective2 = perspective(fov, aspect, zNear, zFar);
  var camera = multiply(perspective2, inverse(look));
  var pWorld = compile(shaders_default.vMain, shaders_default.fMain);
  var pWorldUniform = uniforms(pWorld);
  var pScreen = compile(shaders_default.vScreenQuad, shaders_default.fScreen);
  var pScreenUniform = uniforms(pScreen);
  function loop() {
    startTime = Date.now();
    gl.useProgram(pWorld);
    pWorldUniform.camera(camera);
    attr(pWorld, "vert", bufs[VERT], 3);
    attr(pWorld, "norm", bufs[NORM], 3);
    attr(pWorld, "etc", bufs[ETC], 4);
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer2);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.clear(DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs[FACE]);
    gl.drawElements(TRIANGLES, arrays[FACE].length, UNSIGNED_INT, 0);
    gl.useProgram(pScreen);
    bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    gl.drawArrays(TRIANGLES, 0, 6);
    t++;
    gl.flush();
    console.log(`Rendered in ${Date.now() - startTime} ms`);
  }
  window.onclick = loop;
  loop();
})();
