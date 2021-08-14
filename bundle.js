(() => {
  // src/glconsts.js
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

  // src/gllib.ts
  var gl;
  var debug = true;
  function glContext(c) {
    gl = c.getContext("webgl2");
    gl.enable(DEPTH_TEST);
  }
  function gl2Shader(mode, body) {
    let src = `#version 300 es
precision highp float;
${body}`;
    const shader = gl.createShader(mode);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (debug) {
      const e = gl.getShaderInfoLog(shader);
      if (e) {
        console.log("shader:", e);
        console.log(src.split("\n").map((s, i) => `${i + 1}. ${s}`).join("\n"));
      }
    }
    return shader;
  }
  function glCompile(vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
  }
  var TEX_RGBA = [UNSIGNED_BYTE, RGBA];
  var TEX_DEPTHS = [UNSIGNED_SHORT, DEPTH_COMPONENT, DEPTH_COMPONENT16];
  function glTexture(width2, height2, format, source) {
    const texture = gl.createTexture();
    gl.bindTexture(TEXTURE_2D, texture);
    gl.texImage2D(TEXTURE_2D, 0, format[2] || format[1], width2, height2, 0, format[1], format[0], source);
    texture["fmt"] = format;
    gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
    gl.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST);
    gl.bindTexture(TEXTURE_2D, null);
    return texture;
  }
  function glFramebuffer(textures2) {
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
  function glBindTextures(textures2, uniforms) {
    for (let i = 0; i < textures2.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      uniforms[i](i);
      gl.bindTexture(TEXTURE_2D, textures2[i]);
    }
  }
  function glDrawQuad() {
    gl.drawArrays(TRIANGLES, 0, 6);
  }
  function glUniforms(p) {
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
  function glDatabuffer() {
    return gl.createBuffer();
  }
  function glSetDatabuffer(buffer, data, bindingPoint = ARRAY_BUFFER) {
    gl.bindBuffer(bindingPoint, buffer);
    gl.bufferData(bindingPoint, data, STATIC_DRAW);
  }
  function glAttr(program, name, buffer, itemSize = 3) {
    let loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(loc, itemSize, FLOAT, false, 0, 0);
  }

  // src/shaders/gradient.glsl
  var gradient_default = "int NUM_OCTAVES = 10;\n\n\n// 1,2,3\n\nfloat rand(vec2 n) { \n	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nfloat noise(vec2 p){\n	vec2 ip = floor(p);\n	vec2 u = fract(p);\n	u = u*u*(3.0-2.0*u);\n	\n	float res = mix(\n		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),\n		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);\n	return res*res;\n}\n\n\n/*\n// Simplex\n\nvec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }\n\nfloat noise(vec2 v){\n  const vec4 C = vec4(0.211324865405187, 0.366025403784439,\n           -0.577350269189626, 0.024390243902439);\n  vec2 i  = floor(v + dot(v, C.yy) );\n  vec2 x0 = v -   i + dot(i, C.xx);\n  vec2 i1;\n  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n  vec4 x12 = x0.xyxy + C.xxzz;\n  x12.xy -= i1;\n  i = mod(i, 289.0);\n  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n  + i.x + vec3(0.0, i1.x, 1.0 ));\n  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),\n    dot(x12.zw,x12.zw)), 0.0);\n  m = m*m ;\n  m = m*m ;\n  vec3 x = 2.0 * fract(p * C.www) - 1.0;\n  vec3 h = abs(x) - 0.5;\n  vec3 ox = floor(x + 0.5);\n  vec3 a0 = x - ox;\n  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n  vec3 g;\n  g.x  = a0.x  * x0.x  + h.x  * x0.y;\n  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n  return 0.5 + 130.0 * dot(m, g) * 0.5;\n}\n*/\n\nfloat fbm(vec2 x) {\n	float v = 0.0;\n	float a = 0.5;\n	vec2 shift = vec2(100);\n  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));\n	for (int i = 0; i < NUM_OCTAVES; ++i) {\n		v += a * noise(x);\n		x = rot * x * 2.0 + shift;\n		a *= 0.6;\n	}\n	return v;\n}\n";

  // src/shaders/fmain.glsl
  var fmain_default = "uniform float t;\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\nvoid main() {\n  c0 = vec4(sin(gl_FragCoord.x), 0., t*0., 1.);  \n  c1 = vec4(sin(gl_FragCoord.y), 0., 0., 1.);\n}\n";

  // src/shaders/fscreen.glsl
  var fscreen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\n\nout vec4 c;\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  c = vec4(texelFetch(T0, F, 0).r, texelFetch(T1, F, 0).r, texelFetch(Depth, F, 0).r, 1.);\n  c.a = 1.;\n}";

  // src/shaders/vscreenQuad.glsl
  var vscreenQuad_default = "void main() {\n  int i = gl_VertexID;\n  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders/vasIs.glsl
  var vasIs_default = "in vec4 position;\r\n\r\nout vec4 v_position;\r\nout vec2 v_texCoord;\r\n\r\nvoid main() {\r\n  gl_Position = position;\r\n  v_texCoord = position.xy*0.5 + vec2(0.5);\r\n}";

  // src/shaders.ts
  var shaders_default = {fmain: fmain_default, gradient: gradient_default, fscreen: fscreen_default, vscreenQuad: vscreenQuad_default, vasIs: vasIs_default};

  // src/math3d.ts
  var X = 0;
  var Y = 1;
  var Z = 2;
  var axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var arr = (n) => [...new Array(n)].map((_, i) => i);
  var mI = arr(16).map((n) => n % 5 ? 0 : 1);
  var mMul = (a, b) => a.map((_, n) => arr(4).reduce((s, i) => s + a[n - n % 4 + i] * b[n % 4 + i * 4], 0));
  var mAdd = (a, b) => a.map((x, i) => x + b[i]);
  var mnMul = (m, n) => m.map((x) => n * x);
  var mvMul = (m, v) => v3(arr(4).map((i) => v4(v).reduce((s, x, j) => s + x * m[j + i * 4], 0)));
  var mTrace = (a) => a[0] + a[5] + a[10] + a[15];
  var mSet = (m, s) => {
    m = [...m];
    for (let k in s)
      m[k] = s[k];
    return m;
  };
  var v4 = (v, w = 1) => [v[0], v[1], v[2], w];
  var v3 = (v) => [v[0], v[1], v[2]];
  var vLen = (v) => Math.hypot(v[0], v[1], v[2]);
  var vnMul = (v, n) => [v[0] * n, v[1] * n, v[2] * n];
  var vNorm = (v, len = 1) => vnMul(v, 1 / vLen(v));
  var mSum = (a, b, ...args) => {
    const v = mnMul(b, a);
    return args.length ? mAdd(v, mSum(...args)) : v;
  };
  var mLook = (dir, up = axis[Y]) => {
    const z = vNorm(vnMul(dir, -1));
    const x = vCross(z, up);
    const y = vCross(x, z);
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
      0,
      0,
      0,
      1
    ];
  };
  var mPerspective = (fieldOfViewYInRadians, aspect2, zNear2, zFar2) => {
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
  var mTranspose = (m) => m.map((_, i) => m[i % 4 * 4 + ~~(i / 4)]);
  function mInverse(A) {
    const AA = mMul(A, A);
    const AAA = mMul(A, AA);
    const AAAA = mMul(AA, AA);
    const trA = mTrace(A);
    const trAA = mTrace(AA);
    const trAAA = mTrace(AAA);
    const trAAAA = mTrace(AAAA);
    const det = (trA ** 4 - 6 * trAA * trA * trA + 3 * trAA * trAA + 8 * trAAA * trA - 6 * trAAAA) / 24;
    if (!det)
      throw "det=0";
    let sum = mSum((trA * trA * trA - 3 * trA * trAA + 2 * trAAA) / 6, mI, -(trA * trA - trAA) / 2, A, trA, AA, -1, AAA);
    return mnMul(sum, 1 / det);
  }
  var mCross = (v) => [
    0,
    -v[Z],
    v[Y],
    0,
    v[Z],
    0,
    -v[X],
    0,
    -v[Y],
    v[X],
    0,
    0,
    0,
    0,
    0,
    1
  ];
  var vCross = (v, w) => mvMul(mCross(w), v);
  var test = () => {
    let mat = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      1,
      9,
      10,
      1,
      12,
      3,
      14,
      15,
      16
    ];
    console.log(mTranspose(mat));
  };
  test();

  // src/prog.ts
  console.log("mset", mSet([1, 2, 3], {1: 5}));
  var width = 800;
  var height = 800;
  var C = document.getElementById("C");
  C.width = width;
  C.height = height;
  glContext(C);
  var vertBuf = glDatabuffer();
  glSetDatabuffer(vertBuf, new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]));
  var indexBuf = glDatabuffer();
  glSetDatabuffer(indexBuf, new Uint16Array([0, 1, 2, 2, 1, 3]), ELEMENT_ARRAY_BUFFER);
  var vFullScreenQuad = gl2Shader(VERTEX_SHADER, shaders_default.vscreenQuad);
  var textures = [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map((tex) => glTexture(width, height, tex));
  var framebuffer = glFramebuffer(textures);
  var t = 0;
  var fov = 50 * Math.PI / 180;
  var aspect = width / height;
  var zNear = 0.5;
  var zFar = 800;
  var projection = mPerspective(fov, aspect, zNear, zFar);
  var camera = mLook([0, 0, 1]);
  var view = mInverse(camera);
  var viewProjection = mMul(projection, view);
  var pm = glCompile(gl2Shader(VERTEX_SHADER, shaders_default.vasIs), gl2Shader(FRAGMENT_SHADER, `${shaders_default.fmain}`));
  var pmUniform = glUniforms(pm);
  var ps = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders_default.fscreen));
  var psUniform = glUniforms(ps);
  function loop() {
    gl.useProgram(pm);
    glAttr(pm, "position", vertBuf, 3);
    gl.bindFramebuffer(FRAMEBUFFER, framebuffer);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.clear(DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.drawElements(TRIANGLES, 6, UNSIGNED_SHORT, 0);
    gl.useProgram(ps);
    glBindTextures(textures, [psUniform.T0, psUniform.T1, psUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    glDrawQuad();
    t++;
  }
  window.onclick = loop;
  loop();
})();
