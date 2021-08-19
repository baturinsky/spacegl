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
  var VERT = 0;
  var FACE = 1;
  var NORM = 2;
  function pie(r, h, sectors) {
    let vert = [], norm2 = [], face = [];
    const bottom = sectors * 2, top = sectors * 2 + 1;
    vert[bottom] = [0, 0, 0];
    norm2[bottom] = [0, 0, -1];
    vert[top] = [0, 0, h];
    norm2[top] = [0, 0, 1];
    const angleStep = Math.PI * 2 / sectors;
    for (let i = 0; i < sectors; i++) {
      let a = angle2d(angleStep * i);
      let an = angle2d(angleStep * (i + 0.5));
      let x = r * a[X];
      let y = r * a[Y];
      vert[i] = [x, y, 0];
      vert[i + sectors] = [x, y, h];
      norm2[i] = norm2[i + sectors] = [an[X], an[Y], 0];
    }
    for (let i = 0; i < sectors; i++) {
      let j = (i + 1) % sectors;
      face[i * 4] = [i, j, bottom];
      face[i * 4 + 1] = [i + sectors, j + sectors, top];
      face[i * 4 + 2] = [j, j + sectors, i];
      face[i * 4 + 3] = [i + sectors, j + sectors, i];
    }
    return [vert, face, norm2];
  }
  function shapesToBuffers(shapes) {
    let l = shapes.length;
    let count = new Array(l + 1);
    count[0] = [0, 0, 0];
    for (let i = 0; i < l; i++) {
      count[i + 1] = count[i].map((v, j) => v + shapes[i][j].length);
    }
    let bufs = [new Float32Array(count[l][VERT] * 3), new Uint32Array(count[l][FACE] * 3), new Float32Array(count[l][NORM] * 3)];
    shapes.forEach((shape, shapei) => {
      for (let layer of [VERT, FACE, NORM]) {
        shape[layer].forEach((el, i) => {
          if (layer == FACE)
            el = addn(el, count[shapei][VERT]);
          bufs[layer].set(el, (count[shapei][layer] + i) * 3);
        });
      }
    });
    return bufs;
  }

  // src/g0/v3.ts
  var axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var len = (v) => Math.hypot(v[0], v[1], v[2]);
  var scale = (v, n) => [v[0] * n, v[1] * n, v[2] * n];
  var norm = (v, l = 1) => scale(v, l / len(v));
  var addn = (v, n) => [v[0] + n, v[1] + n, v[2] + n];
  var sub = (v, w) => [v[0] - w[0], v[1] - w[1], v[2] - w[2]];
  var cross = (a, b) => [a[Y] * b[Z] - a[Z] * b[Y], a[Z] * b[X] - a[X] * b[Z], a[X] * b[Y] - a[Y] * b[X]];
  var angle2d = (a) => [Math.cos(a), Math.sin(a)];

  // src/g0/m4.ts
  var UP = axis[Y];
  function transform(m, v) {
    const [v0, v1, v2] = v;
    const d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];
    return [
      (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d,
      (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d,
      (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d
    ];
  }
  var transformShape = (m, shape) => [
    shape[VERT].map((v) => transform(m, v)),
    shape[FACE],
    shape[NORM].map((v) => transformDirection(m, v))
  ];
  var multiply = (a, b) => a.map((_, n) => arr(4).reduce((s, i) => s + b[n - n % 4 + i] * a[n % 4 + i * 4], 0));
  var add = (a, b) => a.map((x, i) => x + b[i]);
  var scale2 = (m, n) => m.map((x) => n * x);
  var trace = (a) => a[0] + a[5] + a[10] + a[15];
  var sum = (a, b, ...args) => {
    const v = scale2(b, a);
    return args.length ? add(v, sum(...args)) : v;
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
  function transformDirection(m, v) {
    const [v0, v1, v2] = v;
    return [
      v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0],
      v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1],
      v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2]
    ];
  }
  var translation = (v) => [
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
    v[X],
    v[Y],
    v[Z],
    1
  ];

  // src/shaders/fMain.glsl
  var fMain_default = "uniform float t;\n\nflat in vec3 normal;\nin vec2 uv;\n\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\n\nvoid main() {\n  //c0 = vec4(normal*0.5+0.5, 1.);  \n  float light = dot(normal, normalize(vec3(-1.,-2.,3.)));\n  c0 = vec4(vec3(light), 1.);\n  c1 = vec4(sin(gl_FragCoord.y*.5)+.5, 0., 0., 1.);\n}\n";

  // src/shaders/fScreen.glsl
  var fScreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\n\nout vec4 c;\n\nint bayer[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);\nint b64[64] = int[] (1,33,9,41,3,35,11,43,49,17,57,25,51,19,59,27,13,45,5,37,15,47,7,39,61,29,53,21,63,31,55,23,4,36,12,44,2,34,10,42,52,20,60,28,50,18,58,26,16,48,8,40,14,46,6,38,64,32,56,24,62,30,54,22);\n\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  c = vec4(0.);\n  float depth = texelFetch(Depth, F, 0).r;\n  c.rgb = vec3(texelFetch(T0, F, 0).r*65. > float(b64[F.y%8*8 + F.x%8])?1.:0.);\n  //c.rgb = vec3(texelFetch(T0, F, 0).r*65. > float(F.y/1000%65));\n  //c.rgb = vec3(1. + sin(float(F.y)*2000.));\n  float diff = 0.;\n  for(int i = 0; i < 4; i++) {\n    float edge = texelFetch(Depth, F + ivec2(i % 2, i / 2), 0).r + texelFetch(Depth, F - ivec2(i % 2, i / 2), 0).r - depth * 2.;\n    diff += abs(edge);\n  }\n  if(diff > .00005)\n    c.rgb = vec3(0.);\n  if(depth == 1.)\n    c.rgb = vec3(1.);\n  c.a = 1.;\n}";

  // src/shaders/vScreenQuad.glsl
  var vScreenQuad_default = "void main() {\n  int i = gl_VertexID;\n  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders/vCamera.glsl
  var vCamera_default = "uniform mat4 camera;\r\n\r\nin vec3 vert;\r\nin vec3 norm;\r\n\r\nout vec2 uv;\r\nflat out vec3 normal;\r\n\r\nvoid main() {  \r\n  vec4 glpos = camera * vec4(vert, 1.);  \r\n  glpos.y = - glpos.y;\r\n  gl_Position = glpos / glpos.w;\r\n  uv = vert.xy*0.5 + vec2(0.5);\r\n  normal = norm;\r\n}";

  // src/shaders.ts
  var shaders = {fMain: fMain_default, vCamera: vCamera_default, fScreen: fScreen_default, vScreenQuad: vScreenQuad_default};
  var shaders_default = shaders;

  // src/prog.ts
  var width = 1600;
  var height = 800;
  var C = document.getElementById("C");
  C.width = width;
  C.height = height;
  context(C);
  console.log(Date.now());
  var pp = [];
  function generate() {
    for (let i = 0; i < 1e5; i++) {
      let m = multiply(translation([Math.random() * 200 - 100, Math.random() * 100, 0]), axisRotation([0, 0, 1], Math.random() * 6));
      pp.push(transformShape(m, pie(Math.random() + 0.3, 1 + Math.random() ** 7 * 5, ~~(Math.random() * 10) + 3)));
    }
  }
  generate();
  var arrays = shapesToBuffers(pp);
  var vertBuf = databuffer();
  var normBuf = databuffer();
  var indexBuf = databuffer();
  function setDatabuffers() {
    setDatabuffer(vertBuf, arrays[0]);
    setDatabuffer(indexBuf, arrays[1], ELEMENT_ARRAY_BUFFER);
    setDatabuffer(normBuf, arrays[2]);
  }
  console.log(arrays);
  setDatabuffers();
  console.log(Date.now());
  var textures = [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map((tex) => texture(width, height, tex));
  var framebuffer2 = framebuffer(textures);
  var t = 0;
  var fov = 50 * Math.PI / 180;
  var aspect = width / height;
  var zNear = 0.5;
  var zFar = 200;
  var look = lookAt([0, -10, 20], [0, 30, 0], [0, 0, 1]);
  var perspective2 = perspective(fov, aspect, zNear, zFar);
  var camera = multiply(perspective2, inverse(look));
  var pWorld = compile(shaders_default.vCamera, shaders_default.fMain);
  var pWorldUniform = uniforms(pWorld);
  var pScreen = compile(shaders_default.vScreenQuad, shaders_default.fScreen);
  var pScreenUniform = uniforms(pScreen);
  function loop() {
    gl.useProgram(pWorld);
    pWorldUniform.camera(camera);
    attr(pWorld, "vert", vertBuf, 3);
    attr(pWorld, "norm", normBuf, 3);
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer2);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.clear(DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.drawElements(TRIANGLES, arrays[FACE].length, UNSIGNED_INT, 0);
    gl.useProgram(pScreen);
    bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    gl.drawArrays(TRIANGLES, 0, 6);
    t++;
  }
  console.log("done");
  window.onclick = loop;
  loop();
})();
