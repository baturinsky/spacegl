(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {get: all[name], enumerable: true});
  };

  // src/glconsts.js
  var DEPTH_BUFFER_BIT = 256;
  var TRIANGLES = 4;
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
  function glFramebuffer(textures3) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(FRAMEBUFFER, fb);
    for (let i = 0; i < textures3.length; i++) {
      let format = textures3[i]["fmt"] && textures3[i]["fmt"][1];
      let attachment = format == DEPTH_STENCIL ? DEPTH_STENCIL_ATTACHMENT : format == DEPTH_COMPONENT ? DEPTH_ATTACHMENT : COLOR_ATTACHMENT0 + i;
      gl.framebufferTexture2D(FRAMEBUFFER, attachment, TEXTURE_2D, textures3[i], 0);
    }
    gl.bindFramebuffer(FRAMEBUFFER, null);
    return fb;
  }
  function glBindTextures(textures3, uniforms) {
    for (let i = 0; i < textures3.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      uniforms[i](i);
      gl.bindTexture(TEXTURE_2D, textures3[i]);
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

  // src/shaders/gradient.glsl
  var gradient_default = "int NUM_OCTAVES = 10;\n\n\n// 1,2,3\n\nfloat rand(vec2 n) { \n	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nfloat noise(vec2 p){\n	vec2 ip = floor(p);\n	vec2 u = fract(p);\n	u = u*u*(3.0-2.0*u);\n	\n	float res = mix(\n		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),\n		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);\n	return res*res;\n}\n\n\n/*\n// Simplex\n\nvec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }\n\nfloat noise(vec2 v){\n  const vec4 C = vec4(0.211324865405187, 0.366025403784439,\n           -0.577350269189626, 0.024390243902439);\n  vec2 i  = floor(v + dot(v, C.yy) );\n  vec2 x0 = v -   i + dot(i, C.xx);\n  vec2 i1;\n  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n  vec4 x12 = x0.xyxy + C.xxzz;\n  x12.xy -= i1;\n  i = mod(i, 289.0);\n  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n  + i.x + vec3(0.0, i1.x, 1.0 ));\n  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),\n    dot(x12.zw,x12.zw)), 0.0);\n  m = m*m ;\n  m = m*m ;\n  vec3 x = 2.0 * fract(p * C.www) - 1.0;\n  vec3 h = abs(x) - 0.5;\n  vec3 ox = floor(x + 0.5);\n  vec3 a0 = x - ox;\n  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n  vec3 g;\n  g.x  = a0.x  * x0.x  + h.x  * x0.y;\n  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n  return 0.5 + 130.0 * dot(m, g) * 0.5;\n}\n*/\n\nfloat fbm(vec2 x) {\n	float v = 0.0;\n	float a = 0.5;\n	vec2 shift = vec2(100);\n  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));\n	for (int i = 0; i < NUM_OCTAVES; ++i) {\n		v += a * noise(x);\n		x = rot * x * 2.0 + shift;\n		a *= 0.6;\n	}\n	return v;\n}\n";

  // src/shaders/main.glsl
  var main_default = "uniform float t;\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\nvoid main() {\n  float v = fbm(gl_FragCoord.xy / 50. + vec2(0, t * 10.));\n  c0 = vec4(0, v, 0, 1);\n  float w = fbm(gl_FragCoord.xy / 200. + vec2(0, t * 10.)) - 0.5;\n  w = .5 / (1. + w * w * 4e2);\n  c1 = vec4(0, w, 0, 1);\n  gl_FragDepth = 0.3;\n}\n";

  // src/shaders/screen.glsl
  var screen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\n\nout vec4 c;\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  c = vec4(texelFetch(T0, F, 0).g, texelFetch(T1, F, 0).g, texelFetch(Depth, F, 0).r*1., 1.);\n  c.a = 1.;\n}";

  // src/shaders/screenQuad.glsl
  var screenQuad_default = "void main() {\n  int i = gl_VertexID;\n  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);\n}";

  // src/shaders.ts
  var shaders_default = {main: main_default, gradient: gradient_default, screen: screen_default, screenQuad: screenQuad_default};

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

  // src/twgl/m4.js
  var m4_exports = {};
  __export(m4_exports, {
    axisRotate: () => axisRotate,
    axisRotation: () => axisRotation,
    copy: () => copy,
    frustum: () => frustum,
    getAxis: () => getAxis,
    getTranslation: () => getTranslation,
    identity: () => identity,
    inverse: () => inverse,
    lookAt: () => lookAt,
    multiply: () => multiply2,
    negate: () => negate,
    ortho: () => ortho,
    perspective: () => perspective,
    rotateX: () => rotateX,
    rotateY: () => rotateY,
    rotateZ: () => rotateZ,
    rotationX: () => rotationX,
    rotationY: () => rotationY,
    rotationZ: () => rotationZ,
    scale: () => scale,
    scaling: () => scaling,
    setAxis: () => setAxis,
    setDefaultType: () => setDefaultType,
    setTranslation: () => setTranslation,
    transformDirection: () => transformDirection,
    transformNormal: () => transformNormal,
    transformPoint: () => transformPoint,
    translate: () => translate,
    translation: () => translation,
    transpose: () => transpose
  });

  // src/twgl/v3.js
  var VecType = Float32Array;
  function create(x, y, z) {
    const dst = new VecType(3);
    if (x) {
      dst[0] = x;
    }
    if (y) {
      dst[1] = y;
    }
    if (z) {
      dst[2] = z;
    }
    return dst;
  }
  function add(a, b, dst) {
    dst = dst || new VecType(3);
    dst[0] = a[0] + b[0];
    dst[1] = a[1] + b[1];
    dst[2] = a[2] + b[2];
    return dst;
  }
  function subtract(a, b, dst) {
    dst = dst || new VecType(3);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    dst[2] = a[2] - b[2];
    return dst;
  }
  function cross(a, b, dst) {
    dst = dst || new VecType(3);
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    dst[0] = a[1] * b[2] - a[2] * b[1];
    dst[1] = t1;
    dst[2] = t2;
    return dst;
  }
  function normalize(a, dst) {
    dst = dst || new VecType(3);
    const lenSq = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    const len = Math.sqrt(lenSq);
    if (len > 1e-5) {
      dst[0] = a[0] / len;
      dst[1] = a[1] / len;
      dst[2] = a[2] / len;
    } else {
      dst[0] = 0;
      dst[1] = 0;
      dst[2] = 0;
    }
    return dst;
  }
  function multiply(a, b, dst) {
    dst = dst || new VecType(3);
    dst[0] = a[0] * b[0];
    dst[1] = a[1] * b[1];
    dst[2] = a[2] * b[2];
    return dst;
  }

  // src/twgl/m4.js
  var MatType = Float32Array;
  var tempV3a = create();
  var tempV3b = create();
  var tempV3c = create();
  function setDefaultType(ctor) {
    const oldType = MatType;
    MatType = ctor;
    return oldType;
  }
  function negate(m, dst) {
    dst = dst || new MatType(16);
    dst[0] = -m[0];
    dst[1] = -m[1];
    dst[2] = -m[2];
    dst[3] = -m[3];
    dst[4] = -m[4];
    dst[5] = -m[5];
    dst[6] = -m[6];
    dst[7] = -m[7];
    dst[8] = -m[8];
    dst[9] = -m[9];
    dst[10] = -m[10];
    dst[11] = -m[11];
    dst[12] = -m[12];
    dst[13] = -m[13];
    dst[14] = -m[14];
    dst[15] = -m[15];
    return dst;
  }
  function copy(m, dst) {
    dst = dst || new MatType(16);
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[3] = m[3];
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[7] = m[7];
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
    return dst;
  }
  function identity(dst) {
    dst = dst || new MatType(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  }
  function transpose(m, dst) {
    dst = dst || new MatType(16);
    if (dst === m) {
      let t2;
      t2 = m[1];
      m[1] = m[4];
      m[4] = t2;
      t2 = m[2];
      m[2] = m[8];
      m[8] = t2;
      t2 = m[3];
      m[3] = m[12];
      m[12] = t2;
      t2 = m[6];
      m[6] = m[9];
      m[9] = t2;
      t2 = m[7];
      m[7] = m[13];
      m[13] = t2;
      t2 = m[11];
      m[11] = m[14];
      m[14] = t2;
      return dst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    dst[0] = m00;
    dst[1] = m10;
    dst[2] = m20;
    dst[3] = m30;
    dst[4] = m01;
    dst[5] = m11;
    dst[6] = m21;
    dst[7] = m31;
    dst[8] = m02;
    dst[9] = m12;
    dst[10] = m22;
    dst[11] = m32;
    dst[12] = m03;
    dst[13] = m13;
    dst[14] = m23;
    dst[15] = m33;
    return dst;
  }
  function inverse(m, dst) {
    dst = dst || new MatType(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;
    const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
    return dst;
  }
  function multiply2(a, b, dst) {
    dst = dst || new MatType(16);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a13 = a[4 + 3];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const a23 = a[8 + 3];
    const a30 = a[12 + 0];
    const a31 = a[12 + 1];
    const a32 = a[12 + 2];
    const a33 = a[12 + 3];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b13 = b[4 + 3];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    const b23 = b[8 + 3];
    const b30 = b[12 + 0];
    const b31 = b[12 + 1];
    const b32 = b[12 + 2];
    const b33 = b[12 + 3];
    dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return dst;
  }
  function setTranslation(a, v, dst) {
    dst = dst || identity();
    if (a !== dst) {
      dst[0] = a[0];
      dst[1] = a[1];
      dst[2] = a[2];
      dst[3] = a[3];
      dst[4] = a[4];
      dst[5] = a[5];
      dst[6] = a[6];
      dst[7] = a[7];
      dst[8] = a[8];
      dst[9] = a[9];
      dst[10] = a[10];
      dst[11] = a[11];
    }
    dst[12] = v[0];
    dst[13] = v[1];
    dst[14] = v[2];
    dst[15] = 1;
    return dst;
  }
  function getTranslation(m, dst) {
    dst = dst || create();
    dst[0] = m[12];
    dst[1] = m[13];
    dst[2] = m[14];
    return dst;
  }
  function getAxis(m, axis2, dst) {
    dst = dst || create();
    const off = axis2 * 4;
    dst[0] = m[off + 0];
    dst[1] = m[off + 1];
    dst[2] = m[off + 2];
    return dst;
  }
  function setAxis(a, v, axis2, dst) {
    if (dst !== a) {
      dst = copy(a, dst);
    }
    const off = axis2 * 4;
    dst[off + 0] = v[0];
    dst[off + 1] = v[1];
    dst[off + 2] = v[2];
    return dst;
  }
  function perspective(fieldOfViewYInRadians, aspect2, zNear2, zFar2, dst) {
    dst = dst || new MatType(16);
    const f = 1 / Math.tan(0.5 * fieldOfViewYInRadians);
    const rangeInv = 1 / (zNear2 - zFar2);
    dst[0] = f / aspect2;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = f;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = (zNear2 + zFar2) * rangeInv;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = zNear2 * zFar2 * rangeInv * 2;
    dst[15] = 0;
    return dst;
  }
  function ortho(left, right, bottom, top, near, far, dst) {
    dst = dst || new MatType(16);
    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 2 / (near - far);
    dst[11] = 0;
    dst[12] = (right + left) / (left - right);
    dst[13] = (top + bottom) / (bottom - top);
    dst[14] = (far + near) / (near - far);
    dst[15] = 1;
    return dst;
  }
  function frustum(left, right, bottom, top, near, far, dst) {
    dst = dst || new MatType(16);
    const dx = right - left;
    const dy = top - bottom;
    const dz = near - far;
    dst[0] = 2 * near / dx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 * near / dy;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = (left + right) / dx;
    dst[9] = (top + bottom) / dy;
    dst[10] = far / dz;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = near * far / dz;
    dst[15] = 0;
    return dst;
  }
  function lookAt(eye, target, up, dst) {
    dst = dst || new MatType(16);
    const xAxis = tempV3a;
    const yAxis = tempV3b;
    const zAxis = tempV3c;
    normalize(subtract(eye, target, zAxis), zAxis);
    normalize(cross(up, zAxis, xAxis), xAxis);
    normalize(cross(zAxis, xAxis, yAxis), yAxis);
    dst[0] = xAxis[0];
    dst[1] = xAxis[1];
    dst[2] = xAxis[2];
    dst[3] = 0;
    dst[4] = yAxis[0];
    dst[5] = yAxis[1];
    dst[6] = yAxis[2];
    dst[7] = 0;
    dst[8] = zAxis[0];
    dst[9] = zAxis[1];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = eye[0];
    dst[13] = eye[1];
    dst[14] = eye[2];
    dst[15] = 1;
    return dst;
  }
  function translation(v, dst) {
    dst = dst || new MatType(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = v[0];
    dst[13] = v[1];
    dst[14] = v[2];
    dst[15] = 1;
    return dst;
  }
  function translate(m, v, dst) {
    dst = dst || new MatType(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    if (m !== dst) {
      dst[0] = m00;
      dst[1] = m01;
      dst[2] = m02;
      dst[3] = m03;
      dst[4] = m10;
      dst[5] = m11;
      dst[6] = m12;
      dst[7] = m13;
      dst[8] = m20;
      dst[9] = m21;
      dst[10] = m22;
      dst[11] = m23;
    }
    dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return dst;
  }
  function rotationX(angleInRadians, dst) {
    dst = dst || new MatType(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = c;
    dst[6] = s;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  }
  function rotateX(m, angleInRadians, dst) {
    dst = dst || new MatType(16);
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[4] = c * m10 + s * m20;
    dst[5] = c * m11 + s * m21;
    dst[6] = c * m12 + s * m22;
    dst[7] = c * m13 + s * m23;
    dst[8] = c * m20 - s * m10;
    dst[9] = c * m21 - s * m11;
    dst[10] = c * m22 - s * m12;
    dst[11] = c * m23 - s * m13;
    if (m !== dst) {
      dst[0] = m[0];
      dst[1] = m[1];
      dst[2] = m[2];
      dst[3] = m[3];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }
    return dst;
  }
  function rotationY(angleInRadians, dst) {
    dst = dst || new MatType(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c;
    dst[1] = 0;
    dst[2] = -s;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = s;
    dst[9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  }
  function rotateY(m, angleInRadians, dst) {
    dst = dst || new MatType(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c * m00 - s * m20;
    dst[1] = c * m01 - s * m21;
    dst[2] = c * m02 - s * m22;
    dst[3] = c * m03 - s * m23;
    dst[8] = c * m20 + s * m00;
    dst[9] = c * m21 + s * m01;
    dst[10] = c * m22 + s * m02;
    dst[11] = c * m23 + s * m03;
    if (m !== dst) {
      dst[4] = m[4];
      dst[5] = m[5];
      dst[6] = m[6];
      dst[7] = m[7];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }
    return dst;
  }
  function rotationZ(angleInRadians, dst) {
    dst = dst || new MatType(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  }
  function rotateZ(m, angleInRadians, dst) {
    dst = dst || new MatType(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c * m00 + s * m10;
    dst[1] = c * m01 + s * m11;
    dst[2] = c * m02 + s * m12;
    dst[3] = c * m03 + s * m13;
    dst[4] = c * m10 - s * m00;
    dst[5] = c * m11 - s * m01;
    dst[6] = c * m12 - s * m02;
    dst[7] = c * m13 - s * m03;
    if (m !== dst) {
      dst[8] = m[8];
      dst[9] = m[9];
      dst[10] = m[10];
      dst[11] = m[11];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }
    return dst;
  }
  function axisRotation(axis2, angleInRadians, dst) {
    dst = dst || new MatType(16);
    let x = axis2[0];
    let y = axis2[1];
    let z = axis2[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    dst[0] = xx + (1 - xx) * c;
    dst[1] = x * y * oneMinusCosine + z * s;
    dst[2] = x * z * oneMinusCosine - y * s;
    dst[3] = 0;
    dst[4] = x * y * oneMinusCosine - z * s;
    dst[5] = yy + (1 - yy) * c;
    dst[6] = y * z * oneMinusCosine + x * s;
    dst[7] = 0;
    dst[8] = x * z * oneMinusCosine + y * s;
    dst[9] = y * z * oneMinusCosine - x * s;
    dst[10] = zz + (1 - zz) * c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  }
  function axisRotate(m, axis2, angleInRadians, dst) {
    dst = dst || new MatType(16);
    let x = axis2[0];
    let y = axis2[1];
    let z = axis2[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    const r00 = xx + (1 - xx) * c;
    const r01 = x * y * oneMinusCosine + z * s;
    const r02 = x * z * oneMinusCosine - y * s;
    const r10 = x * y * oneMinusCosine - z * s;
    const r11 = yy + (1 - yy) * c;
    const r12 = y * z * oneMinusCosine + x * s;
    const r20 = x * z * oneMinusCosine + y * s;
    const r21 = y * z * oneMinusCosine - x * s;
    const r22 = zz + (1 - zz) * c;
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
    dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
    dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
    dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
    dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
    dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
    dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
    dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
    dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
    dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
    dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
    if (m !== dst) {
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }
    return dst;
  }
  function scaling(v, dst) {
    dst = dst || new MatType(16);
    dst[0] = v[0];
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = v[1];
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = v[2];
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  }
  function scale(m, v, dst) {
    dst = dst || new MatType(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    dst[0] = v0 * m[0 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2];
    dst[3] = v0 * m[0 * 4 + 3];
    dst[4] = v1 * m[1 * 4 + 0];
    dst[5] = v1 * m[1 * 4 + 1];
    dst[6] = v1 * m[1 * 4 + 2];
    dst[7] = v1 * m[1 * 4 + 3];
    dst[8] = v2 * m[2 * 4 + 0];
    dst[9] = v2 * m[2 * 4 + 1];
    dst[10] = v2 * m[2 * 4 + 2];
    dst[11] = v2 * m[2 * 4 + 3];
    if (m !== dst) {
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }
    return dst;
  }
  function transformPoint(m, v, dst) {
    dst = dst || create();
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];
    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;
    return dst;
  }
  function transformDirection(m, v, dst) {
    dst = dst || create();
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
    return dst;
  }
  function transformNormal(m, v, dst) {
    dst = dst || create();
    const mi = inverse(m);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];
    return dst;
  }

  // src/twgl/typedarrays.js
  var BYTE = 5120;
  var UNSIGNED_BYTE2 = 5121;
  var SHORT = 5122;
  var UNSIGNED_SHORT2 = 5123;
  var INT2 = 5124;
  var UNSIGNED_INT2 = 5125;
  var FLOAT2 = 5126;
  var UNSIGNED_SHORT_4_4_4_4 = 32819;
  var UNSIGNED_SHORT_5_5_5_1 = 32820;
  var UNSIGNED_SHORT_5_6_5 = 33635;
  var HALF_FLOAT = 5131;
  var UNSIGNED_INT_2_10_10_10_REV = 33640;
  var UNSIGNED_INT_10F_11F_11F_REV = 35899;
  var UNSIGNED_INT_5_9_9_9_REV = 35902;
  var FLOAT_32_UNSIGNED_INT_24_8_REV2 = 36269;
  var UNSIGNED_INT_24_8 = 34042;
  var glTypeToTypedArray = {};
  {
    const tt = glTypeToTypedArray;
    tt[BYTE] = Int8Array;
    tt[UNSIGNED_BYTE2] = Uint8Array;
    tt[SHORT] = Int16Array;
    tt[UNSIGNED_SHORT2] = Uint16Array;
    tt[INT2] = Int32Array;
    tt[UNSIGNED_INT2] = Uint32Array;
    tt[FLOAT2] = Float32Array;
    tt[UNSIGNED_SHORT_4_4_4_4] = Uint16Array;
    tt[UNSIGNED_SHORT_5_5_5_1] = Uint16Array;
    tt[UNSIGNED_SHORT_5_6_5] = Uint16Array;
    tt[HALF_FLOAT] = Uint16Array;
    tt[UNSIGNED_INT_2_10_10_10_REV] = Uint32Array;
    tt[UNSIGNED_INT_10F_11F_11F_REV] = Uint32Array;
    tt[UNSIGNED_INT_5_9_9_9_REV] = Uint32Array;
    tt[FLOAT_32_UNSIGNED_INT_24_8_REV2] = Uint32Array;
    tt[UNSIGNED_INT_24_8] = Uint32Array;
  }
  function getGLTypeForTypedArray(typedArray) {
    if (typedArray instanceof Int8Array) {
      return BYTE;
    }
    if (typedArray instanceof Uint8Array) {
      return UNSIGNED_BYTE2;
    }
    if (typedArray instanceof Uint8ClampedArray) {
      return UNSIGNED_BYTE2;
    }
    if (typedArray instanceof Int16Array) {
      return SHORT;
    }
    if (typedArray instanceof Uint16Array) {
      return UNSIGNED_SHORT2;
    }
    if (typedArray instanceof Int32Array) {
      return INT2;
    }
    if (typedArray instanceof Uint32Array) {
      return UNSIGNED_INT2;
    }
    if (typedArray instanceof Float32Array) {
      return FLOAT2;
    }
    throw new Error("unsupported typed array type");
  }
  function getGLTypeForTypedArrayType(typedArrayType) {
    if (typedArrayType === Int8Array) {
      return BYTE;
    }
    if (typedArrayType === Uint8Array) {
      return UNSIGNED_BYTE2;
    }
    if (typedArrayType === Uint8ClampedArray) {
      return UNSIGNED_BYTE2;
    }
    if (typedArrayType === Int16Array) {
      return SHORT;
    }
    if (typedArrayType === Uint16Array) {
      return UNSIGNED_SHORT2;
    }
    if (typedArrayType === Int32Array) {
      return INT2;
    }
    if (typedArrayType === Uint32Array) {
      return UNSIGNED_INT2;
    }
    if (typedArrayType === Float32Array) {
      return FLOAT2;
    }
    throw new Error("unsupported typed array type");
  }
  var isArrayBuffer = typeof SharedArrayBuffer !== "undefined" ? function isArrayBufferOrSharedArrayBuffer(a) {
    return a && a.buffer && (a.buffer instanceof ArrayBuffer || a.buffer instanceof SharedArrayBuffer);
  } : function isArrayBuffer2(a) {
    return a && a.buffer && a.buffer instanceof ArrayBuffer;
  };

  // src/twgl/helper.js
  var error = typeof console !== "undefined" && console.error && typeof console.error === "function" ? console.error.bind(console) : function() {
  };
  var warn = typeof console !== "undefined" && console.warn && typeof console.warn === "function" ? console.warn.bind(console) : function() {
  };
  function isBuffer(gl2, t2) {
    return typeof WebGLBuffer !== "undefined" && t2 instanceof WebGLBuffer;
  }
  function isTexture(gl2, t2) {
    return typeof WebGLTexture !== "undefined" && t2 instanceof WebGLTexture;
  }

  // src/twgl/attributes.js
  var defaults = {
    attribPrefix: ""
  };
  function setBufferFromTypedArray(gl2, type, buffer, array, drawType) {
    gl2.bindBuffer(type, buffer);
    gl2.bufferData(type, array, drawType || gl2.STATIC_DRAW);
  }
  function createBufferFromTypedArray(gl2, typedArray, type, drawType) {
    if (isBuffer(gl2, typedArray)) {
      return typedArray;
    }
    type = type || gl2.ARRAY_BUFFER;
    const buffer = gl2.createBuffer();
    setBufferFromTypedArray(gl2, type, buffer, typedArray, drawType);
    return buffer;
  }
  function isIndices(name) {
    return name === "indices";
  }
  function getNormalizationForTypedArray(typedArray) {
    if (typedArray instanceof Int8Array) {
      return true;
    }
    if (typedArray instanceof Uint8Array) {
      return true;
    }
    return false;
  }
  function getNormalizationForTypedArrayType(typedArrayType) {
    if (typedArrayType === Int8Array) {
      return true;
    }
    if (typedArrayType === Uint8Array) {
      return true;
    }
    return false;
  }
  function getArray(array) {
    return array.length ? array : array.data;
  }
  var texcoordRE = /coord|texture/i;
  var colorRE = /color|colour/i;
  function guessNumComponentsFromName(name, length2) {
    let numComponents;
    if (texcoordRE.test(name)) {
      numComponents = 2;
    } else if (colorRE.test(name)) {
      numComponents = 4;
    } else {
      numComponents = 3;
    }
    if (length2 % numComponents > 0) {
      throw new Error(`Can not guess numComponents for attribute '${name}'. Tried ${numComponents} but ${length2} values is not evenly divisible by ${numComponents}. You should specify it.`);
    }
    return numComponents;
  }
  function getNumComponents(array, arrayName) {
    return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
  }
  function makeTypedArray(array, name) {
    if (isArrayBuffer(array)) {
      return array;
    }
    if (isArrayBuffer(array.data)) {
      return array.data;
    }
    if (Array.isArray(array)) {
      array = {
        data: array
      };
    }
    let Type = array.type;
    if (!Type) {
      if (isIndices(name)) {
        Type = Uint16Array;
      } else {
        Type = Float32Array;
      }
    }
    return new Type(array.data);
  }
  function createAttribsFromArrays(gl2, arrays) {
    const attribs = {};
    Object.keys(arrays).forEach(function(arrayName) {
      if (!isIndices(arrayName)) {
        const array = arrays[arrayName];
        const attribName = array.attrib || array.name || array.attribName || defaults.attribPrefix + arrayName;
        if (array.value) {
          if (!Array.isArray(array.value) && !isArrayBuffer(array.value)) {
            throw new Error("array.value is not array or typedarray");
          }
          attribs[attribName] = {
            value: array.value
          };
        } else {
          let buffer;
          let type;
          let normalization;
          let numComponents;
          if (array.buffer && array.buffer instanceof WebGLBuffer) {
            buffer = array.buffer;
            numComponents = array.numComponents || array.size;
            type = array.type;
            normalization = array.normalize;
          } else if (typeof array === "number" || typeof array.data === "number") {
            const numValues = array.data || array;
            const arrayType = array.type || Float32Array;
            const numBytes = numValues * arrayType.BYTES_PER_ELEMENT;
            type = getGLTypeForTypedArrayType(arrayType);
            normalization = array.normalize !== void 0 ? array.normalize : getNormalizationForTypedArrayType(arrayType);
            numComponents = array.numComponents || array.size || guessNumComponentsFromName(arrayName, numValues);
            buffer = gl2.createBuffer();
            gl2.bindBuffer(gl2.ARRAY_BUFFER, buffer);
            gl2.bufferData(gl2.ARRAY_BUFFER, numBytes, array.drawType || gl2.STATIC_DRAW);
          } else {
            const typedArray = makeTypedArray(array, arrayName);
            buffer = createBufferFromTypedArray(gl2, typedArray, void 0, array.drawType);
            type = getGLTypeForTypedArray(typedArray);
            normalization = array.normalize !== void 0 ? array.normalize : getNormalizationForTypedArray(typedArray);
            numComponents = getNumComponents(array, arrayName);
          }
          attribs[attribName] = {
            buffer,
            numComponents,
            type,
            normalize: normalization,
            stride: array.stride || 0,
            offset: array.offset || 0,
            divisor: array.divisor === void 0 ? void 0 : array.divisor,
            drawType: array.drawType
          };
        }
      }
    });
    gl2.bindBuffer(gl2.ARRAY_BUFFER, null);
    return attribs;
  }
  function getBytesPerValueForGLType(gl2, type) {
    if (type === gl2.BYTE)
      return 1;
    if (type === gl2.UNSIGNED_BYTE)
      return 1;
    if (type === gl2.SHORT)
      return 2;
    if (type === gl2.UNSIGNED_SHORT)
      return 2;
    if (type === gl2.INT)
      return 4;
    if (type === gl2.UNSIGNED_INT)
      return 4;
    if (type === gl2.FLOAT)
      return 4;
    return 0;
  }
  var positionKeys = ["position", "positions", "a_position"];
  function getNumElementsFromNonIndexedArrays(arrays) {
    let key;
    let ii;
    for (ii = 0; ii < positionKeys.length; ++ii) {
      key = positionKeys[ii];
      if (key in arrays) {
        break;
      }
    }
    if (ii === positionKeys.length) {
      key = Object.keys(arrays)[0];
    }
    const array = arrays[key];
    const length2 = getArray(array).length;
    const numComponents = getNumComponents(array, key);
    const numElements = length2 / numComponents;
    if (length2 % numComponents > 0) {
      throw new Error(`numComponents ${numComponents} not correct for length ${length2}`);
    }
    return numElements;
  }
  function getNumElementsFromAttributes(gl2, attribs) {
    let key;
    let ii;
    for (ii = 0; ii < positionKeys.length; ++ii) {
      key = positionKeys[ii];
      if (key in attribs) {
        break;
      }
      key = defaults.attribPrefix + key;
      if (key in attribs) {
        break;
      }
    }
    if (ii === positionKeys.length) {
      key = Object.keys(attribs)[0];
    }
    const attrib = attribs[key];
    gl2.bindBuffer(gl2.ARRAY_BUFFER, attrib.buffer);
    const numBytes = gl2.getBufferParameter(gl2.ARRAY_BUFFER, gl2.BUFFER_SIZE);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, null);
    const bytesPerValue = getBytesPerValueForGLType(gl2, attrib.type);
    const totalElements = numBytes / bytesPerValue;
    const numComponents = attrib.numComponents || attrib.size;
    const numElements = totalElements / numComponents;
    if (numElements % 1 !== 0) {
      throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
    }
    return numElements;
  }
  function createBufferInfoFromArrays(gl2, arrays, srcBufferInfo) {
    const newAttribs = createAttribsFromArrays(gl2, arrays);
    const bufferInfo = Object.assign({}, srcBufferInfo ? srcBufferInfo : {});
    bufferInfo.attribs = Object.assign({}, srcBufferInfo ? srcBufferInfo.attribs : {}, newAttribs);
    const indices = arrays.indices;
    if (indices) {
      const newIndices = makeTypedArray(indices, "indices");
      bufferInfo.indices = createBufferFromTypedArray(gl2, newIndices, gl2.ELEMENT_ARRAY_BUFFER);
      bufferInfo.numElements = newIndices.length;
      bufferInfo.elementType = getGLTypeForTypedArray(newIndices);
    } else if (!bufferInfo.numElements) {
      bufferInfo.numElements = getNumElementsFromAttributes(gl2, bufferInfo.attribs);
    }
    return bufferInfo;
  }
  function createBufferFromArray(gl2, array, arrayName) {
    const type = arrayName === "indices" ? gl2.ELEMENT_ARRAY_BUFFER : gl2.ARRAY_BUFFER;
    const typedArray = makeTypedArray(array, arrayName);
    return createBufferFromTypedArray(gl2, typedArray, type);
  }
  function createBuffersFromArrays(gl2, arrays) {
    const buffers2 = {};
    Object.keys(arrays).forEach(function(key) {
      buffers2[key] = createBufferFromArray(gl2, arrays[key], key);
    });
    if (arrays.indices) {
      buffers2.numElements = arrays.indices.length;
      buffers2.elementType = getGLTypeForTypedArray(makeTypedArray(arrays.indices), "indices");
    } else {
      buffers2.numElements = getNumElementsFromNonIndexedArrays(arrays);
    }
    return buffers2;
  }

  // src/twgl/primitives.js
  function augmentTypedArray(typedArray, numComponents) {
    let cursor = 0;
    typedArray.push = function() {
      for (let ii = 0; ii < arguments.length; ++ii) {
        const value = arguments[ii];
        if (value instanceof Array || isArrayBuffer(value)) {
          for (let jj = 0; jj < value.length; ++jj) {
            typedArray[cursor++] = value[jj];
          }
        } else {
          typedArray[cursor++] = value;
        }
      }
    };
    typedArray.reset = function(opt_index) {
      cursor = opt_index || 0;
    };
    typedArray.numComponents = numComponents;
    Object.defineProperty(typedArray, "numElements", {
      get: function() {
        return this.length / this.numComponents | 0;
      }
    });
    return typedArray;
  }
  function createAugmentedTypedArray(numComponents, numElements, opt_type) {
    const Type = opt_type || Float32Array;
    return augmentTypedArray(new Type(numComponents * numElements), numComponents);
  }
  function applyFuncToV3Array(array, matrix, fn) {
    const len = array.length;
    const tmp = new Float32Array(3);
    for (let ii = 0; ii < len; ii += 3) {
      fn(matrix, [array[ii], array[ii + 1], array[ii + 2]], tmp);
      array[ii] = tmp[0];
      array[ii + 1] = tmp[1];
      array[ii + 2] = tmp[2];
    }
  }
  function transformNormal2(mi, v, dst) {
    dst = dst || create();
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];
    return dst;
  }
  function reorientDirections(array, matrix) {
    applyFuncToV3Array(array, matrix, transformDirection);
    return array;
  }
  function reorientNormals(array, matrix) {
    applyFuncToV3Array(array, inverse(matrix), transformNormal2);
    return array;
  }
  function reorientPositions(array, matrix) {
    applyFuncToV3Array(array, matrix, transformPoint);
    return array;
  }
  function reorientVertices(arrays, matrix) {
    Object.keys(arrays).forEach(function(name) {
      const array = arrays[name];
      if (name.indexOf("pos") >= 0) {
        reorientPositions(array, matrix);
      } else if (name.indexOf("tan") >= 0 || name.indexOf("binorm") >= 0) {
        reorientDirections(array, matrix);
      } else if (name.indexOf("norm") >= 0) {
        reorientNormals(array, matrix);
      }
    });
    return arrays;
  }
  function createXYQuadVertices(size, xOffset, yOffset) {
    size = size || 2;
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    size *= 0.5;
    return {
      position: {
        numComponents: 2,
        data: [
          xOffset + -1 * size,
          yOffset + -1 * size,
          xOffset + 1 * size,
          yOffset + -1 * size,
          xOffset + -1 * size,
          yOffset + 1 * size,
          xOffset + 1 * size,
          yOffset + 1 * size
        ]
      },
      normal: [
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1
      ],
      texcoord: [
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        1
      ],
      indices: [0, 1, 2, 2, 1, 3]
    };
  }
  function createPlaneVertices(width2, depth, subdivisionsWidth, subdivisionsDepth, matrix) {
    width2 = width2 || 1;
    depth = depth || 1;
    subdivisionsWidth = subdivisionsWidth || 1;
    subdivisionsDepth = subdivisionsDepth || 1;
    matrix = matrix || identity();
    const numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    for (let z = 0; z <= subdivisionsDepth; z++) {
      for (let x = 0; x <= subdivisionsWidth; x++) {
        const u = x / subdivisionsWidth;
        const v = z / subdivisionsDepth;
        positions.push(width2 * u - width2 * 0.5, 0, depth * v - depth * 0.5);
        normals.push(0, 1, 0);
        texcoords.push(u, v);
      }
    }
    const numVertsAcross = subdivisionsWidth + 1;
    const indices = createAugmentedTypedArray(3, subdivisionsWidth * subdivisionsDepth * 2, Uint16Array);
    for (let z = 0; z < subdivisionsDepth; z++) {
      for (let x = 0; x < subdivisionsWidth; x++) {
        indices.push((z + 0) * numVertsAcross + x, (z + 1) * numVertsAcross + x, (z + 0) * numVertsAcross + x + 1);
        indices.push((z + 1) * numVertsAcross + x, (z + 1) * numVertsAcross + x + 1, (z + 0) * numVertsAcross + x + 1);
      }
    }
    const arrays = reorientVertices({
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    }, matrix);
    return arrays;
  }
  function createSphereVertices(radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians) {
    if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
      throw new Error("subdivisionAxis and subdivisionHeight must be > 0");
    }
    opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
    opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
    opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
    opt_endLongitudeInRadians = opt_endLongitudeInRadians || Math.PI * 2;
    const latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
    const longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;
    const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    for (let y = 0; y <= subdivisionsHeight; y++) {
      for (let x = 0; x <= subdivisionsAxis; x++) {
        const u = x / subdivisionsAxis;
        const v = y / subdivisionsHeight;
        const theta = longRange * u + opt_startLongitudeInRadians;
        const phi = latRange * v + opt_startLatitudeInRadians;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const ux = cosTheta * sinPhi;
        const uy = cosPhi;
        const uz = sinTheta * sinPhi;
        positions.push(radius * ux, radius * uy, radius * uz);
        normals.push(ux, uy, uz);
        texcoords.push(1 - u, v);
      }
    }
    const numVertsAround = subdivisionsAxis + 1;
    const indices = createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
    for (let x = 0; x < subdivisionsAxis; x++) {
      for (let y = 0; y < subdivisionsHeight; y++) {
        indices.push((y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x);
        indices.push((y + 1) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x + 1);
      }
    }
    return {
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    };
  }
  var CUBE_FACE_INDICES = [
    [3, 7, 5, 1],
    [6, 2, 0, 4],
    [6, 7, 3, 2],
    [0, 1, 5, 4],
    [7, 6, 4, 5],
    [2, 3, 1, 0]
  ];
  function createCubeVertices(size) {
    size = size || 1;
    const k = size / 2;
    const cornerVertices = [
      [-k, -k, -k],
      [+k, -k, -k],
      [-k, +k, -k],
      [+k, +k, -k],
      [-k, -k, +k],
      [+k, -k, +k],
      [-k, +k, +k],
      [+k, +k, +k]
    ];
    const faceNormals = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ];
    const uvCoords = [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1]
    ];
    const numVertices = 6 * 4;
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    const indices = createAugmentedTypedArray(3, 6 * 2, Uint16Array);
    for (let f = 0; f < 6; ++f) {
      const faceIndices = CUBE_FACE_INDICES[f];
      for (let v = 0; v < 4; ++v) {
        const position = cornerVertices[faceIndices[v]];
        const normal = faceNormals[f];
        const uv = uvCoords[v];
        positions.push(position);
        normals.push(normal);
        texcoords.push(uv);
      }
      const offset = 4 * f;
      indices.push(offset + 0, offset + 1, offset + 2);
      indices.push(offset + 0, offset + 2, offset + 3);
    }
    return {
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    };
  }
  function createTruncatedConeVertices(bottomRadius, topRadius, height2, radialSubdivisions, verticalSubdivisions, opt_topCap, opt_bottomCap) {
    if (radialSubdivisions < 3) {
      throw new Error("radialSubdivisions must be 3 or greater");
    }
    if (verticalSubdivisions < 1) {
      throw new Error("verticalSubdivisions must be 1 or greater");
    }
    const topCap = opt_topCap === void 0 ? true : opt_topCap;
    const bottomCap = opt_bottomCap === void 0 ? true : opt_bottomCap;
    const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);
    const numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    const indices = createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra) * 2, Uint16Array);
    const vertsAroundEdge = radialSubdivisions + 1;
    const slant = Math.atan2(bottomRadius - topRadius, height2);
    const cosSlant = Math.cos(slant);
    const sinSlant = Math.sin(slant);
    const start = topCap ? -2 : 0;
    const end = verticalSubdivisions + (bottomCap ? 2 : 0);
    for (let yy = start; yy <= end; ++yy) {
      let v = yy / verticalSubdivisions;
      let y = height2 * v;
      let ringRadius;
      if (yy < 0) {
        y = 0;
        v = 1;
        ringRadius = bottomRadius;
      } else if (yy > verticalSubdivisions) {
        y = height2;
        v = 1;
        ringRadius = topRadius;
      } else {
        ringRadius = bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions);
      }
      if (yy === -2 || yy === verticalSubdivisions + 2) {
        ringRadius = 0;
        v = 0;
      }
      y -= height2 / 2;
      for (let ii = 0; ii < vertsAroundEdge; ++ii) {
        const sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
        const cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
        positions.push(sin * ringRadius, y, cos * ringRadius);
        normals.push(yy < 0 || yy > verticalSubdivisions ? 0 : sin * cosSlant, yy < 0 ? -1 : yy > verticalSubdivisions ? 1 : sinSlant, yy < 0 || yy > verticalSubdivisions ? 0 : cos * cosSlant);
        texcoords.push(ii / radialSubdivisions, 1 - v);
      }
    }
    for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
      for (let ii = 0; ii < radialSubdivisions; ++ii) {
        indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 0) + 1 + ii, vertsAroundEdge * (yy + 1) + 1 + ii);
        indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 1) + 1 + ii, vertsAroundEdge * (yy + 1) + 0 + ii);
      }
    }
    return {
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    };
  }
  function expandRLEData(rleData, padding) {
    padding = padding || [];
    const data = [];
    for (let ii = 0; ii < rleData.length; ii += 4) {
      const runLength = rleData[ii];
      const element = rleData.slice(ii + 1, ii + 4);
      element.push.apply(element, padding);
      for (let jj = 0; jj < runLength; ++jj) {
        data.push.apply(data, element);
      }
    }
    return data;
  }
  function create3DFVertices() {
    const positions = [
      0,
      0,
      0,
      0,
      150,
      0,
      30,
      0,
      0,
      0,
      150,
      0,
      30,
      150,
      0,
      30,
      0,
      0,
      30,
      0,
      0,
      30,
      30,
      0,
      100,
      0,
      0,
      30,
      30,
      0,
      100,
      30,
      0,
      100,
      0,
      0,
      30,
      60,
      0,
      30,
      90,
      0,
      67,
      60,
      0,
      30,
      90,
      0,
      67,
      90,
      0,
      67,
      60,
      0,
      0,
      0,
      30,
      30,
      0,
      30,
      0,
      150,
      30,
      0,
      150,
      30,
      30,
      0,
      30,
      30,
      150,
      30,
      30,
      0,
      30,
      100,
      0,
      30,
      30,
      30,
      30,
      30,
      30,
      30,
      100,
      0,
      30,
      100,
      30,
      30,
      30,
      60,
      30,
      67,
      60,
      30,
      30,
      90,
      30,
      30,
      90,
      30,
      67,
      60,
      30,
      67,
      90,
      30,
      0,
      0,
      0,
      100,
      0,
      0,
      100,
      0,
      30,
      0,
      0,
      0,
      100,
      0,
      30,
      0,
      0,
      30,
      100,
      0,
      0,
      100,
      30,
      0,
      100,
      30,
      30,
      100,
      0,
      0,
      100,
      30,
      30,
      100,
      0,
      30,
      30,
      30,
      0,
      30,
      30,
      30,
      100,
      30,
      30,
      30,
      30,
      0,
      100,
      30,
      30,
      100,
      30,
      0,
      30,
      30,
      0,
      30,
      60,
      30,
      30,
      30,
      30,
      30,
      30,
      0,
      30,
      60,
      0,
      30,
      60,
      30,
      30,
      60,
      0,
      67,
      60,
      30,
      30,
      60,
      30,
      30,
      60,
      0,
      67,
      60,
      0,
      67,
      60,
      30,
      67,
      60,
      0,
      67,
      90,
      30,
      67,
      60,
      30,
      67,
      60,
      0,
      67,
      90,
      0,
      67,
      90,
      30,
      30,
      90,
      0,
      30,
      90,
      30,
      67,
      90,
      30,
      30,
      90,
      0,
      67,
      90,
      30,
      67,
      90,
      0,
      30,
      90,
      0,
      30,
      150,
      30,
      30,
      90,
      30,
      30,
      90,
      0,
      30,
      150,
      0,
      30,
      150,
      30,
      0,
      150,
      0,
      0,
      150,
      30,
      30,
      150,
      30,
      0,
      150,
      0,
      30,
      150,
      30,
      30,
      150,
      0,
      0,
      0,
      0,
      0,
      0,
      30,
      0,
      150,
      30,
      0,
      0,
      0,
      0,
      150,
      30,
      0,
      150,
      0
    ];
    const texcoords = [
      0.22,
      0.19,
      0.22,
      0.79,
      0.34,
      0.19,
      0.22,
      0.79,
      0.34,
      0.79,
      0.34,
      0.19,
      0.34,
      0.19,
      0.34,
      0.31,
      0.62,
      0.19,
      0.34,
      0.31,
      0.62,
      0.31,
      0.62,
      0.19,
      0.34,
      0.43,
      0.34,
      0.55,
      0.49,
      0.43,
      0.34,
      0.55,
      0.49,
      0.55,
      0.49,
      0.43,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      1,
      0
    ];
    const normals = expandRLEData([
      18,
      0,
      0,
      1,
      18,
      0,
      0,
      -1,
      6,
      0,
      1,
      0,
      6,
      1,
      0,
      0,
      6,
      0,
      -1,
      0,
      6,
      1,
      0,
      0,
      6,
      0,
      1,
      0,
      6,
      1,
      0,
      0,
      6,
      0,
      -1,
      0,
      6,
      1,
      0,
      0,
      6,
      0,
      -1,
      0,
      6,
      -1,
      0,
      0
    ]);
    const colors = expandRLEData([
      18,
      200,
      70,
      120,
      18,
      80,
      70,
      200,
      6,
      70,
      200,
      210,
      6,
      200,
      200,
      70,
      6,
      210,
      100,
      70,
      6,
      210,
      160,
      70,
      6,
      70,
      180,
      210,
      6,
      100,
      70,
      210,
      6,
      76,
      210,
      100,
      6,
      140,
      210,
      80,
      6,
      90,
      130,
      110,
      6,
      160,
      160,
      220
    ], [255]);
    const numVerts = positions.length / 3;
    const arrays = {
      position: createAugmentedTypedArray(3, numVerts),
      texcoord: createAugmentedTypedArray(2, numVerts),
      normal: createAugmentedTypedArray(3, numVerts),
      color: createAugmentedTypedArray(4, numVerts, Uint8Array),
      indices: createAugmentedTypedArray(3, numVerts / 3, Uint16Array)
    };
    arrays.position.push(positions);
    arrays.texcoord.push(texcoords);
    arrays.normal.push(normals);
    arrays.color.push(colors);
    for (let ii = 0; ii < numVerts; ++ii) {
      arrays.indices.push(ii);
    }
    return arrays;
  }
  function createCrescentVertices(verticalRadius, outerRadius, innerRadius, thickness, subdivisionsDown, startOffset, endOffset) {
    if (subdivisionsDown <= 0) {
      throw new Error("subdivisionDown must be > 0");
    }
    startOffset = startOffset || 0;
    endOffset = endOffset || 1;
    const subdivisionsThick = 2;
    const offsetRange = endOffset - startOffset;
    const numVertices = (subdivisionsDown + 1) * 2 * (2 + subdivisionsThick);
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    function lerp(a, b, s) {
      return a + (b - a) * s;
    }
    function createArc(arcRadius, x, normalMult, normalAdd, uMult, uAdd) {
      for (let z = 0; z <= subdivisionsDown; z++) {
        const uBack = x / (subdivisionsThick - 1);
        const v = z / subdivisionsDown;
        const xBack = (uBack - 0.5) * 2;
        const angle = (startOffset + v * offsetRange) * Math.PI;
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const radius = lerp(verticalRadius, arcRadius, s);
        const px = xBack * thickness;
        const py = c * verticalRadius;
        const pz = s * radius;
        positions.push(px, py, pz);
        const n = add(multiply([0, s, c], normalMult), normalAdd);
        normals.push(n);
        texcoords.push(uBack * uMult + uAdd, v);
      }
    }
    for (let x = 0; x < subdivisionsThick; x++) {
      const uBack = (x / (subdivisionsThick - 1) - 0.5) * 2;
      createArc(outerRadius, x, [1, 1, 1], [0, 0, 0], 1, 0);
      createArc(outerRadius, x, [0, 0, 0], [uBack, 0, 0], 0, 0);
      createArc(innerRadius, x, [1, 1, 1], [0, 0, 0], 1, 0);
      createArc(innerRadius, x, [0, 0, 0], [uBack, 0, 0], 0, 1);
    }
    const indices = createAugmentedTypedArray(3, subdivisionsDown * 2 * (2 + subdivisionsThick), Uint16Array);
    function createSurface(leftArcOffset, rightArcOffset) {
      for (let z = 0; z < subdivisionsDown; ++z) {
        indices.push(leftArcOffset + z + 0, leftArcOffset + z + 1, rightArcOffset + z + 0);
        indices.push(leftArcOffset + z + 1, rightArcOffset + z + 1, rightArcOffset + z + 0);
      }
    }
    const numVerticesDown = subdivisionsDown + 1;
    createSurface(numVerticesDown * 0, numVerticesDown * 4);
    createSurface(numVerticesDown * 5, numVerticesDown * 7);
    createSurface(numVerticesDown * 6, numVerticesDown * 2);
    createSurface(numVerticesDown * 3, numVerticesDown * 1);
    return {
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    };
  }
  function createCylinderVertices(radius, height2, radialSubdivisions, verticalSubdivisions, topCap, bottomCap) {
    return createTruncatedConeVertices(radius, radius, height2, radialSubdivisions, verticalSubdivisions, topCap, bottomCap);
  }
  function createTorusVertices(radius, thickness, radialSubdivisions, bodySubdivisions, startAngle, endAngle) {
    if (radialSubdivisions < 3) {
      throw new Error("radialSubdivisions must be 3 or greater");
    }
    if (bodySubdivisions < 3) {
      throw new Error("verticalSubdivisions must be 3 or greater");
    }
    startAngle = startAngle || 0;
    endAngle = endAngle || Math.PI * 2;
    const range = endAngle - startAngle;
    const radialParts = radialSubdivisions + 1;
    const bodyParts = bodySubdivisions + 1;
    const numVertices = radialParts * bodyParts;
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    const indices = createAugmentedTypedArray(3, radialSubdivisions * bodySubdivisions * 2, Uint16Array);
    for (let slice = 0; slice < bodyParts; ++slice) {
      const v = slice / bodySubdivisions;
      const sliceAngle = v * Math.PI * 2;
      const sliceSin = Math.sin(sliceAngle);
      const ringRadius = radius + sliceSin * thickness;
      const ny = Math.cos(sliceAngle);
      const y = ny * thickness;
      for (let ring = 0; ring < radialParts; ++ring) {
        const u = ring / radialSubdivisions;
        const ringAngle = startAngle + u * range;
        const xSin = Math.sin(ringAngle);
        const zCos = Math.cos(ringAngle);
        const x = xSin * ringRadius;
        const z = zCos * ringRadius;
        const nx = xSin * sliceSin;
        const nz = zCos * sliceSin;
        positions.push(x, y, z);
        normals.push(nx, ny, nz);
        texcoords.push(u, 1 - v);
      }
    }
    for (let slice = 0; slice < bodySubdivisions; ++slice) {
      for (let ring = 0; ring < radialSubdivisions; ++ring) {
        const nextRingIndex = 1 + ring;
        const nextSliceIndex = 1 + slice;
        indices.push(radialParts * slice + ring, radialParts * nextSliceIndex + ring, radialParts * slice + nextRingIndex);
        indices.push(radialParts * nextSliceIndex + ring, radialParts * nextSliceIndex + nextRingIndex, radialParts * slice + nextRingIndex);
      }
    }
    return {
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    };
  }
  function createDiscVertices(radius, divisions, stacks, innerRadius, stackPower) {
    if (divisions < 3) {
      throw new Error("divisions must be at least 3");
    }
    stacks = stacks ? stacks : 1;
    stackPower = stackPower ? stackPower : 1;
    innerRadius = innerRadius ? innerRadius : 0;
    const numVertices = (divisions + 1) * (stacks + 1);
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals = createAugmentedTypedArray(3, numVertices);
    const texcoords = createAugmentedTypedArray(2, numVertices);
    const indices = createAugmentedTypedArray(3, stacks * divisions * 2, Uint16Array);
    let firstIndex = 0;
    const radiusSpan = radius - innerRadius;
    const pointsPerStack = divisions + 1;
    for (let stack = 0; stack <= stacks; ++stack) {
      const stackRadius = innerRadius + radiusSpan * Math.pow(stack / stacks, stackPower);
      for (let i = 0; i <= divisions; ++i) {
        const theta = 2 * Math.PI * i / divisions;
        const x = stackRadius * Math.cos(theta);
        const z = stackRadius * Math.sin(theta);
        positions.push(x, 0, z);
        normals.push(0, 1, 0);
        texcoords.push(1 - i / divisions, stack / stacks);
        if (stack > 0 && i !== divisions) {
          const a = firstIndex + (i + 1);
          const b = firstIndex + i;
          const c = firstIndex + i - pointsPerStack;
          const d = firstIndex + (i + 1) - pointsPerStack;
          indices.push(a, b, c);
          indices.push(a, c, d);
        }
      }
      firstIndex += divisions + 1;
    }
    return {
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices
    };
  }
  function createBufferFunc(fn) {
    return function(gl2) {
      const arrays = fn.apply(this, Array.prototype.slice.call(arguments, 1));
      return createBuffersFromArrays(gl2, arrays);
    };
  }
  function createBufferInfoFunc(fn) {
    return function(gl2) {
      const arrays = fn.apply(null, Array.prototype.slice.call(arguments, 1));
      return createBufferInfoFromArrays(gl2, arrays);
    };
  }
  var create3DFBufferInfo = createBufferInfoFunc(create3DFVertices);
  var create3DFBuffers = createBufferFunc(create3DFVertices);
  var createCubeBufferInfo = createBufferInfoFunc(createCubeVertices);
  var createCubeBuffers = createBufferFunc(createCubeVertices);
  var createPlaneBufferInfo = createBufferInfoFunc(createPlaneVertices);
  var createPlaneBuffers = createBufferFunc(createPlaneVertices);
  var createSphereBufferInfo = createBufferInfoFunc(createSphereVertices);
  var createSphereBuffers = createBufferFunc(createSphereVertices);
  var createTruncatedConeBufferInfo = createBufferInfoFunc(createTruncatedConeVertices);
  var createTruncatedConeBuffers = createBufferFunc(createTruncatedConeVertices);
  var createXYQuadBufferInfo = createBufferInfoFunc(createXYQuadVertices);
  var createXYQuadBuffers = createBufferFunc(createXYQuadVertices);
  var createCrescentBufferInfo = createBufferInfoFunc(createCrescentVertices);
  var createCrescentBuffers = createBufferFunc(createCrescentVertices);
  var createCylinderBufferInfo = createBufferInfoFunc(createCylinderVertices);
  var createCylinderBuffers = createBufferFunc(createCylinderVertices);
  var createTorusBufferInfo = createBufferInfoFunc(createTorusVertices);
  var createTorusBuffers = createBufferFunc(createTorusVertices);
  var createDiscBufferInfo = createBufferInfoFunc(createDiscVertices);
  var createDiscBuffers = createBufferFunc(createDiscVertices);

  // src/twgl/utils.js
  function isWebGL2(gl2) {
    return !!gl2.texStorage2D;
  }
  var glEnumToString = function() {
    const haveEnumsForType = {};
    const enums = {};
    function addEnums(gl2) {
      const type = gl2.constructor.name;
      if (!haveEnumsForType[type]) {
        for (const key in gl2) {
          if (typeof gl2[key] === "number") {
            const existing = enums[gl2[key]];
            enums[gl2[key]] = existing ? `${existing} | ${key}` : key;
          }
        }
        haveEnumsForType[type] = true;
      }
    }
    return function glEnumToString2(gl2, value) {
      addEnums(gl2);
      return enums[value] || "0x" + value.toString(16);
    };
  }();

  // src/twgl/textures.js
  var defaults2 = {
    textureColor: new Uint8Array([128, 192, 255, 255]),
    textureOptions: {},
    crossOrigin: void 0
  };
  var ctx = typeof document !== "undefined" && document.createElement ? document.createElement("canvas").getContext("2d") : null;
  var ALPHA = 6406;
  var RGB = 6407;
  var RGBA2 = 6408;
  var LUMINANCE = 6409;
  var LUMINANCE_ALPHA = 6410;
  var DEPTH_COMPONENT2 = 6402;
  var DEPTH_STENCIL2 = 34041;
  var R8 = 33321;
  var R8_SNORM = 36756;
  var R16F = 33325;
  var R32F = 33326;
  var R8UI = 33330;
  var R8I = 33329;
  var RG16UI = 33338;
  var RG16I = 33337;
  var RG32UI = 33340;
  var RG32I = 33339;
  var RG8 = 33323;
  var RG8_SNORM = 36757;
  var RG16F = 33327;
  var RG32F = 33328;
  var RG8UI = 33336;
  var RG8I = 33335;
  var R16UI = 33332;
  var R16I = 33331;
  var R32UI = 33334;
  var R32I = 33333;
  var RGB8 = 32849;
  var SRGB8 = 35905;
  var RGB565 = 36194;
  var RGB8_SNORM = 36758;
  var R11F_G11F_B10F = 35898;
  var RGB9_E5 = 35901;
  var RGB16F = 34843;
  var RGB32F = 34837;
  var RGB8UI = 36221;
  var RGB8I = 36239;
  var RGB16UI = 36215;
  var RGB16I = 36233;
  var RGB32UI = 36209;
  var RGB32I = 36227;
  var RGBA8 = 32856;
  var SRGB8_ALPHA8 = 35907;
  var RGBA8_SNORM = 36759;
  var RGB5_A1 = 32855;
  var RGBA4 = 32854;
  var RGB10_A2 = 32857;
  var RGBA16F2 = 34842;
  var RGBA32F = 34836;
  var RGBA8UI = 36220;
  var RGBA8I = 36238;
  var RGB10_A2UI = 36975;
  var RGBA16UI = 36214;
  var RGBA16I = 36232;
  var RGBA32I = 36226;
  var RGBA32UI = 36208;
  var DEPTH_COMPONENT162 = 33189;
  var DEPTH_COMPONENT242 = 33190;
  var DEPTH_COMPONENT32F2 = 36012;
  var DEPTH32F_STENCIL82 = 36013;
  var DEPTH24_STENCIL82 = 35056;
  var BYTE2 = 5120;
  var UNSIGNED_BYTE3 = 5121;
  var SHORT2 = 5122;
  var UNSIGNED_SHORT3 = 5123;
  var INT3 = 5124;
  var UNSIGNED_INT3 = 5125;
  var FLOAT3 = 5126;
  var UNSIGNED_SHORT_4_4_4_42 = 32819;
  var UNSIGNED_SHORT_5_5_5_12 = 32820;
  var UNSIGNED_SHORT_5_6_52 = 33635;
  var HALF_FLOAT2 = 5131;
  var HALF_FLOAT_OES = 36193;
  var UNSIGNED_INT_2_10_10_10_REV2 = 33640;
  var UNSIGNED_INT_10F_11F_11F_REV2 = 35899;
  var UNSIGNED_INT_5_9_9_9_REV2 = 35902;
  var FLOAT_32_UNSIGNED_INT_24_8_REV3 = 36269;
  var UNSIGNED_INT_24_82 = 34042;
  var RG = 33319;
  var RG_INTEGER = 33320;
  var RED = 6403;
  var RED_INTEGER = 36244;
  var RGB_INTEGER = 36248;
  var RGBA_INTEGER = 36249;
  var formatInfo = {};
  {
    const f = formatInfo;
    f[ALPHA] = {numColorComponents: 1};
    f[LUMINANCE] = {numColorComponents: 1};
    f[LUMINANCE_ALPHA] = {numColorComponents: 2};
    f[RGB] = {numColorComponents: 3};
    f[RGBA2] = {numColorComponents: 4};
    f[RED] = {numColorComponents: 1};
    f[RED_INTEGER] = {numColorComponents: 1};
    f[RG] = {numColorComponents: 2};
    f[RG_INTEGER] = {numColorComponents: 2};
    f[RGB] = {numColorComponents: 3};
    f[RGB_INTEGER] = {numColorComponents: 3};
    f[RGBA2] = {numColorComponents: 4};
    f[RGBA_INTEGER] = {numColorComponents: 4};
    f[DEPTH_COMPONENT2] = {numColorComponents: 1};
    f[DEPTH_STENCIL2] = {numColorComponents: 2};
  }
  var textureInternalFormatInfo = {};
  {
    const t2 = textureInternalFormatInfo;
    t2[ALPHA] = {textureFormat: ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE3, HALF_FLOAT2, HALF_FLOAT_OES, FLOAT3]};
    t2[LUMINANCE] = {textureFormat: LUMINANCE, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE3, HALF_FLOAT2, HALF_FLOAT_OES, FLOAT3]};
    t2[LUMINANCE_ALPHA] = {textureFormat: LUMINANCE_ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [2, 4, 4, 8], type: [UNSIGNED_BYTE3, HALF_FLOAT2, HALF_FLOAT_OES, FLOAT3]};
    t2[RGB] = {textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 6, 6, 12, 2], type: [UNSIGNED_BYTE3, HALF_FLOAT2, HALF_FLOAT_OES, FLOAT3, UNSIGNED_SHORT_5_6_52]};
    t2[RGBA2] = {textureFormat: RGBA2, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE3, HALF_FLOAT2, HALF_FLOAT_OES, FLOAT3, UNSIGNED_SHORT_4_4_4_42, UNSIGNED_SHORT_5_5_5_12]};
    t2[R8] = {textureFormat: RED, colorRenderable: true, textureFilterable: true, bytesPerElement: [1], type: [UNSIGNED_BYTE3]};
    t2[R8_SNORM] = {textureFormat: RED, colorRenderable: false, textureFilterable: true, bytesPerElement: [1], type: [BYTE2]};
    t2[R16F] = {textureFormat: RED, colorRenderable: false, textureFilterable: true, bytesPerElement: [4, 2], type: [FLOAT3, HALF_FLOAT2]};
    t2[R32F] = {textureFormat: RED, colorRenderable: false, textureFilterable: false, bytesPerElement: [4], type: [FLOAT3]};
    t2[R8UI] = {textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [1], type: [UNSIGNED_BYTE3]};
    t2[R8I] = {textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [1], type: [BYTE2]};
    t2[R16UI] = {textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [UNSIGNED_SHORT3]};
    t2[R16I] = {textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [SHORT2]};
    t2[R32UI] = {textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT3]};
    t2[R32I] = {textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [INT3]};
    t2[RG8] = {textureFormat: RG, colorRenderable: true, textureFilterable: true, bytesPerElement: [2], type: [UNSIGNED_BYTE3]};
    t2[RG8_SNORM] = {textureFormat: RG, colorRenderable: false, textureFilterable: true, bytesPerElement: [2], type: [BYTE2]};
    t2[RG16F] = {textureFormat: RG, colorRenderable: false, textureFilterable: true, bytesPerElement: [8, 4], type: [FLOAT3, HALF_FLOAT2]};
    t2[RG32F] = {textureFormat: RG, colorRenderable: false, textureFilterable: false, bytesPerElement: [8], type: [FLOAT3]};
    t2[RG8UI] = {textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [UNSIGNED_BYTE3]};
    t2[RG8I] = {textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [BYTE2]};
    t2[RG16UI] = {textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_SHORT3]};
    t2[RG16I] = {textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [SHORT2]};
    t2[RG32UI] = {textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [UNSIGNED_INT3]};
    t2[RG32I] = {textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [INT3]};
    t2[RGB8] = {textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3], type: [UNSIGNED_BYTE3]};
    t2[SRGB8] = {textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [3], type: [UNSIGNED_BYTE3]};
    t2[RGB565] = {textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 2], type: [UNSIGNED_BYTE3, UNSIGNED_SHORT_5_6_52]};
    t2[RGB8_SNORM] = {textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [3], type: [BYTE2]};
    t2[R11F_G11F_B10F] = {textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6, 4], type: [FLOAT3, HALF_FLOAT2, UNSIGNED_INT_10F_11F_11F_REV2]};
    t2[RGB9_E5] = {textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6, 4], type: [FLOAT3, HALF_FLOAT2, UNSIGNED_INT_5_9_9_9_REV2]};
    t2[RGB16F] = {textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6], type: [FLOAT3, HALF_FLOAT2]};
    t2[RGB32F] = {textureFormat: RGB, colorRenderable: false, textureFilterable: false, bytesPerElement: [12], type: [FLOAT3]};
    t2[RGB8UI] = {textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [3], type: [UNSIGNED_BYTE3]};
    t2[RGB8I] = {textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [3], type: [BYTE2]};
    t2[RGB16UI] = {textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [6], type: [UNSIGNED_SHORT3]};
    t2[RGB16I] = {textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [6], type: [SHORT2]};
    t2[RGB32UI] = {textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [12], type: [UNSIGNED_INT3]};
    t2[RGB32I] = {textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [12], type: [INT3]};
    t2[RGBA8] = {textureFormat: RGBA2, colorRenderable: true, textureFilterable: true, bytesPerElement: [4], type: [UNSIGNED_BYTE3]};
    t2[SRGB8_ALPHA8] = {textureFormat: RGBA2, colorRenderable: true, textureFilterable: true, bytesPerElement: [4], type: [UNSIGNED_BYTE3]};
    t2[RGBA8_SNORM] = {textureFormat: RGBA2, colorRenderable: false, textureFilterable: true, bytesPerElement: [4], type: [BYTE2]};
    t2[RGB5_A1] = {textureFormat: RGBA2, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2, 4], type: [UNSIGNED_BYTE3, UNSIGNED_SHORT_5_5_5_12, UNSIGNED_INT_2_10_10_10_REV2]};
    t2[RGBA4] = {textureFormat: RGBA2, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2], type: [UNSIGNED_BYTE3, UNSIGNED_SHORT_4_4_4_42]};
    t2[RGB10_A2] = {textureFormat: RGBA2, colorRenderable: true, textureFilterable: true, bytesPerElement: [4], type: [UNSIGNED_INT_2_10_10_10_REV2]};
    t2[RGBA16F2] = {textureFormat: RGBA2, colorRenderable: false, textureFilterable: true, bytesPerElement: [16, 8], type: [FLOAT3, HALF_FLOAT2]};
    t2[RGBA32F] = {textureFormat: RGBA2, colorRenderable: false, textureFilterable: false, bytesPerElement: [16], type: [FLOAT3]};
    t2[RGBA8UI] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_BYTE3]};
    t2[RGBA8I] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [BYTE2]};
    t2[RGB10_A2UI] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT_2_10_10_10_REV2]};
    t2[RGBA16UI] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [UNSIGNED_SHORT3]};
    t2[RGBA16I] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [SHORT2]};
    t2[RGBA32I] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [16], type: [INT3]};
    t2[RGBA32UI] = {textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [16], type: [UNSIGNED_INT3]};
    t2[DEPTH_COMPONENT162] = {textureFormat: DEPTH_COMPONENT2, colorRenderable: true, textureFilterable: false, bytesPerElement: [2, 4], type: [UNSIGNED_SHORT3, UNSIGNED_INT3]};
    t2[DEPTH_COMPONENT242] = {textureFormat: DEPTH_COMPONENT2, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT3]};
    t2[DEPTH_COMPONENT32F2] = {textureFormat: DEPTH_COMPONENT2, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [FLOAT3]};
    t2[DEPTH24_STENCIL82] = {textureFormat: DEPTH_STENCIL2, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT_24_82]};
    t2[DEPTH32F_STENCIL82] = {textureFormat: DEPTH_STENCIL2, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [FLOAT_32_UNSIGNED_INT_24_8_REV3]};
    Object.keys(t2).forEach(function(internalFormat) {
      const info = t2[internalFormat];
      info.bytesPerElementMap = {};
      info.bytesPerElement.forEach(function(bytesPerElement, ndx) {
        const type = info.type[ndx];
        info.bytesPerElementMap[type] = bytesPerElement;
      });
    });
  }

  // src/twgl/programs.js
  var getElementById = typeof document !== "undefined" && document.getElementById ? document.getElementById.bind(document) : function() {
    return null;
  };
  var FLOAT4 = 5126;
  var FLOAT_VEC2 = 35664;
  var FLOAT_VEC3 = 35665;
  var FLOAT_VEC4 = 35666;
  var INT4 = 5124;
  var INT_VEC2 = 35667;
  var INT_VEC3 = 35668;
  var INT_VEC4 = 35669;
  var BOOL = 35670;
  var BOOL_VEC2 = 35671;
  var BOOL_VEC3 = 35672;
  var BOOL_VEC4 = 35673;
  var FLOAT_MAT2 = 35674;
  var FLOAT_MAT3 = 35675;
  var FLOAT_MAT42 = 35676;
  var SAMPLER_2D = 35678;
  var SAMPLER_CUBE = 35680;
  var SAMPLER_3D = 35679;
  var SAMPLER_2D_SHADOW = 35682;
  var FLOAT_MAT2x3 = 35685;
  var FLOAT_MAT2x4 = 35686;
  var FLOAT_MAT3x2 = 35687;
  var FLOAT_MAT3x4 = 35688;
  var FLOAT_MAT4x2 = 35689;
  var FLOAT_MAT4x3 = 35690;
  var SAMPLER_2D_ARRAY = 36289;
  var SAMPLER_2D_ARRAY_SHADOW = 36292;
  var SAMPLER_CUBE_SHADOW = 36293;
  var UNSIGNED_INT4 = 5125;
  var UNSIGNED_INT_VEC2 = 36294;
  var UNSIGNED_INT_VEC3 = 36295;
  var UNSIGNED_INT_VEC4 = 36296;
  var INT_SAMPLER_2D = 36298;
  var INT_SAMPLER_3D = 36299;
  var INT_SAMPLER_CUBE = 36300;
  var INT_SAMPLER_2D_ARRAY = 36303;
  var UNSIGNED_INT_SAMPLER_2D = 36306;
  var UNSIGNED_INT_SAMPLER_3D = 36307;
  var UNSIGNED_INT_SAMPLER_CUBE = 36308;
  var UNSIGNED_INT_SAMPLER_2D_ARRAY = 36311;
  var TEXTURE_2D2 = 3553;
  var TEXTURE_CUBE_MAP = 34067;
  var TEXTURE_3D = 32879;
  var TEXTURE_2D_ARRAY = 35866;
  var typeMap = {};
  function getBindPointForSamplerType(gl2, type) {
    return typeMap[type].bindPoint;
  }
  function floatSetter(gl2, location2) {
    return function(v) {
      gl2.uniform1f(location2, v);
    };
  }
  function floatArraySetter(gl2, location2) {
    return function(v) {
      gl2.uniform1fv(location2, v);
    };
  }
  function floatVec2Setter(gl2, location2) {
    return function(v) {
      gl2.uniform2fv(location2, v);
    };
  }
  function floatVec3Setter(gl2, location2) {
    return function(v) {
      gl2.uniform3fv(location2, v);
    };
  }
  function floatVec4Setter(gl2, location2) {
    return function(v) {
      gl2.uniform4fv(location2, v);
    };
  }
  function intSetter(gl2, location2) {
    return function(v) {
      gl2.uniform1i(location2, v);
    };
  }
  function intArraySetter(gl2, location2) {
    return function(v) {
      gl2.uniform1iv(location2, v);
    };
  }
  function intVec2Setter(gl2, location2) {
    return function(v) {
      gl2.uniform2iv(location2, v);
    };
  }
  function intVec3Setter(gl2, location2) {
    return function(v) {
      gl2.uniform3iv(location2, v);
    };
  }
  function intVec4Setter(gl2, location2) {
    return function(v) {
      gl2.uniform4iv(location2, v);
    };
  }
  function uintSetter(gl2, location2) {
    return function(v) {
      gl2.uniform1ui(location2, v);
    };
  }
  function uintArraySetter(gl2, location2) {
    return function(v) {
      gl2.uniform1uiv(location2, v);
    };
  }
  function uintVec2Setter(gl2, location2) {
    return function(v) {
      gl2.uniform2uiv(location2, v);
    };
  }
  function uintVec3Setter(gl2, location2) {
    return function(v) {
      gl2.uniform3uiv(location2, v);
    };
  }
  function uintVec4Setter(gl2, location2) {
    return function(v) {
      gl2.uniform4uiv(location2, v);
    };
  }
  function floatMat2Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix2fv(location2, false, v);
    };
  }
  function floatMat3Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix3fv(location2, false, v);
    };
  }
  function floatMat4Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix4fv(location2, false, v);
    };
  }
  function floatMat23Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix2x3fv(location2, false, v);
    };
  }
  function floatMat32Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix3x2fv(location2, false, v);
    };
  }
  function floatMat24Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix2x4fv(location2, false, v);
    };
  }
  function floatMat42Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix4x2fv(location2, false, v);
    };
  }
  function floatMat34Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix3x4fv(location2, false, v);
    };
  }
  function floatMat43Setter(gl2, location2) {
    return function(v) {
      gl2.uniformMatrix4x3fv(location2, false, v);
    };
  }
  function samplerSetter(gl2, type, unit, location2) {
    const bindPoint = getBindPointForSamplerType(gl2, type);
    return isWebGL2(gl2) ? function(textureOrPair) {
      let texture;
      let sampler;
      if (isTexture(gl2, textureOrPair)) {
        texture = textureOrPair;
        sampler = null;
      } else {
        texture = textureOrPair.texture;
        sampler = textureOrPair.sampler;
      }
      gl2.uniform1i(location2, unit);
      gl2.activeTexture(gl2.TEXTURE0 + unit);
      gl2.bindTexture(bindPoint, texture);
      gl2.bindSampler(unit, sampler);
    } : function(texture) {
      gl2.uniform1i(location2, unit);
      gl2.activeTexture(gl2.TEXTURE0 + unit);
      gl2.bindTexture(bindPoint, texture);
    };
  }
  function samplerArraySetter(gl2, type, unit, location2, size) {
    const bindPoint = getBindPointForSamplerType(gl2, type);
    const units = new Int32Array(size);
    for (let ii = 0; ii < size; ++ii) {
      units[ii] = unit + ii;
    }
    return isWebGL2(gl2) ? function(textures3) {
      gl2.uniform1iv(location2, units);
      textures3.forEach(function(textureOrPair, index) {
        gl2.activeTexture(gl2.TEXTURE0 + units[index]);
        let texture;
        let sampler;
        if (isTexture(gl2, textureOrPair)) {
          texture = textureOrPair;
          sampler = null;
        } else {
          texture = textureOrPair.texture;
          sampler = textureOrPair.sampler;
        }
        gl2.bindSampler(unit, sampler);
        gl2.bindTexture(bindPoint, texture);
      });
    } : function(textures3) {
      gl2.uniform1iv(location2, units);
      textures3.forEach(function(texture, index) {
        gl2.activeTexture(gl2.TEXTURE0 + units[index]);
        gl2.bindTexture(bindPoint, texture);
      });
    };
  }
  typeMap[FLOAT4] = {Type: Float32Array, size: 4, setter: floatSetter, arraySetter: floatArraySetter};
  typeMap[FLOAT_VEC2] = {Type: Float32Array, size: 8, setter: floatVec2Setter};
  typeMap[FLOAT_VEC3] = {Type: Float32Array, size: 12, setter: floatVec3Setter};
  typeMap[FLOAT_VEC4] = {Type: Float32Array, size: 16, setter: floatVec4Setter};
  typeMap[INT4] = {Type: Int32Array, size: 4, setter: intSetter, arraySetter: intArraySetter};
  typeMap[INT_VEC2] = {Type: Int32Array, size: 8, setter: intVec2Setter};
  typeMap[INT_VEC3] = {Type: Int32Array, size: 12, setter: intVec3Setter};
  typeMap[INT_VEC4] = {Type: Int32Array, size: 16, setter: intVec4Setter};
  typeMap[UNSIGNED_INT4] = {Type: Uint32Array, size: 4, setter: uintSetter, arraySetter: uintArraySetter};
  typeMap[UNSIGNED_INT_VEC2] = {Type: Uint32Array, size: 8, setter: uintVec2Setter};
  typeMap[UNSIGNED_INT_VEC3] = {Type: Uint32Array, size: 12, setter: uintVec3Setter};
  typeMap[UNSIGNED_INT_VEC4] = {Type: Uint32Array, size: 16, setter: uintVec4Setter};
  typeMap[BOOL] = {Type: Uint32Array, size: 4, setter: intSetter, arraySetter: intArraySetter};
  typeMap[BOOL_VEC2] = {Type: Uint32Array, size: 8, setter: intVec2Setter};
  typeMap[BOOL_VEC3] = {Type: Uint32Array, size: 12, setter: intVec3Setter};
  typeMap[BOOL_VEC4] = {Type: Uint32Array, size: 16, setter: intVec4Setter};
  typeMap[FLOAT_MAT2] = {Type: Float32Array, size: 16, setter: floatMat2Setter};
  typeMap[FLOAT_MAT3] = {Type: Float32Array, size: 36, setter: floatMat3Setter};
  typeMap[FLOAT_MAT42] = {Type: Float32Array, size: 64, setter: floatMat4Setter};
  typeMap[FLOAT_MAT2x3] = {Type: Float32Array, size: 24, setter: floatMat23Setter};
  typeMap[FLOAT_MAT2x4] = {Type: Float32Array, size: 32, setter: floatMat24Setter};
  typeMap[FLOAT_MAT3x2] = {Type: Float32Array, size: 24, setter: floatMat32Setter};
  typeMap[FLOAT_MAT3x4] = {Type: Float32Array, size: 48, setter: floatMat34Setter};
  typeMap[FLOAT_MAT4x2] = {Type: Float32Array, size: 32, setter: floatMat42Setter};
  typeMap[FLOAT_MAT4x3] = {Type: Float32Array, size: 48, setter: floatMat43Setter};
  typeMap[SAMPLER_2D] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D2};
  typeMap[SAMPLER_CUBE] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP};
  typeMap[SAMPLER_3D] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D};
  typeMap[SAMPLER_2D_SHADOW] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D2};
  typeMap[SAMPLER_2D_ARRAY] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY};
  typeMap[SAMPLER_2D_ARRAY_SHADOW] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY};
  typeMap[SAMPLER_CUBE_SHADOW] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP};
  typeMap[INT_SAMPLER_2D] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D2};
  typeMap[INT_SAMPLER_3D] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D};
  typeMap[INT_SAMPLER_CUBE] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP};
  typeMap[INT_SAMPLER_2D_ARRAY] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY};
  typeMap[UNSIGNED_INT_SAMPLER_2D] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D2};
  typeMap[UNSIGNED_INT_SAMPLER_3D] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D};
  typeMap[UNSIGNED_INT_SAMPLER_CUBE] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP};
  typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = {Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY};
  function floatAttribSetter(gl2, index) {
    return function(b) {
      if (b.value) {
        gl2.disableVertexAttribArray(index);
        switch (b.value.length) {
          case 4:
            gl2.vertexAttrib4fv(index, b.value);
            break;
          case 3:
            gl2.vertexAttrib3fv(index, b.value);
            break;
          case 2:
            gl2.vertexAttrib2fv(index, b.value);
            break;
          case 1:
            gl2.vertexAttrib1fv(index, b.value);
            break;
          default:
            throw new Error("the length of a float constant value must be between 1 and 4!");
        }
      } else {
        gl2.bindBuffer(gl2.ARRAY_BUFFER, b.buffer);
        gl2.enableVertexAttribArray(index);
        gl2.vertexAttribPointer(index, b.numComponents || b.size, b.type || gl2.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
        if (b.divisor !== void 0) {
          gl2.vertexAttribDivisor(index, b.divisor);
        }
      }
    };
  }
  function intAttribSetter(gl2, index) {
    return function(b) {
      if (b.value) {
        gl2.disableVertexAttribArray(index);
        if (b.value.length === 4) {
          gl2.vertexAttrib4iv(index, b.value);
        } else {
          throw new Error("The length of an integer constant value must be 4!");
        }
      } else {
        gl2.bindBuffer(gl2.ARRAY_BUFFER, b.buffer);
        gl2.enableVertexAttribArray(index);
        gl2.vertexAttribIPointer(index, b.numComponents || b.size, b.type || gl2.INT, b.stride || 0, b.offset || 0);
        if (b.divisor !== void 0) {
          gl2.vertexAttribDivisor(index, b.divisor);
        }
      }
    };
  }
  function uintAttribSetter(gl2, index) {
    return function(b) {
      if (b.value) {
        gl2.disableVertexAttribArray(index);
        if (b.value.length === 4) {
          gl2.vertexAttrib4uiv(index, b.value);
        } else {
          throw new Error("The length of an unsigned integer constant value must be 4!");
        }
      } else {
        gl2.bindBuffer(gl2.ARRAY_BUFFER, b.buffer);
        gl2.enableVertexAttribArray(index);
        gl2.vertexAttribIPointer(index, b.numComponents || b.size, b.type || gl2.UNSIGNED_INT, b.stride || 0, b.offset || 0);
        if (b.divisor !== void 0) {
          gl2.vertexAttribDivisor(index, b.divisor);
        }
      }
    };
  }
  function matAttribSetter(gl2, index, typeInfo) {
    const defaultSize = typeInfo.size;
    const count = typeInfo.count;
    return function(b) {
      gl2.bindBuffer(gl2.ARRAY_BUFFER, b.buffer);
      const numComponents = b.size || b.numComponents || defaultSize;
      const size = numComponents / count;
      const type = b.type || gl2.FLOAT;
      const typeInfo2 = typeMap[type];
      const stride = typeInfo2.size * numComponents;
      const normalize2 = b.normalize || false;
      const offset = b.offset || 0;
      const rowOffset = stride / count;
      for (let i = 0; i < count; ++i) {
        gl2.enableVertexAttribArray(index + i);
        gl2.vertexAttribPointer(index + i, size, type, normalize2, stride, offset + rowOffset * i);
        if (b.divisor !== void 0) {
          gl2.vertexAttribDivisor(index + i, b.divisor);
        }
      }
    };
  }
  var attrTypeMap = {};
  attrTypeMap[FLOAT4] = {size: 4, setter: floatAttribSetter};
  attrTypeMap[FLOAT_VEC2] = {size: 8, setter: floatAttribSetter};
  attrTypeMap[FLOAT_VEC3] = {size: 12, setter: floatAttribSetter};
  attrTypeMap[FLOAT_VEC4] = {size: 16, setter: floatAttribSetter};
  attrTypeMap[INT4] = {size: 4, setter: intAttribSetter};
  attrTypeMap[INT_VEC2] = {size: 8, setter: intAttribSetter};
  attrTypeMap[INT_VEC3] = {size: 12, setter: intAttribSetter};
  attrTypeMap[INT_VEC4] = {size: 16, setter: intAttribSetter};
  attrTypeMap[UNSIGNED_INT4] = {size: 4, setter: uintAttribSetter};
  attrTypeMap[UNSIGNED_INT_VEC2] = {size: 8, setter: uintAttribSetter};
  attrTypeMap[UNSIGNED_INT_VEC3] = {size: 12, setter: uintAttribSetter};
  attrTypeMap[UNSIGNED_INT_VEC4] = {size: 16, setter: uintAttribSetter};
  attrTypeMap[BOOL] = {size: 4, setter: intAttribSetter};
  attrTypeMap[BOOL_VEC2] = {size: 8, setter: intAttribSetter};
  attrTypeMap[BOOL_VEC3] = {size: 12, setter: intAttribSetter};
  attrTypeMap[BOOL_VEC4] = {size: 16, setter: intAttribSetter};
  attrTypeMap[FLOAT_MAT2] = {size: 4, setter: matAttribSetter, count: 2};
  attrTypeMap[FLOAT_MAT3] = {size: 9, setter: matAttribSetter, count: 3};
  attrTypeMap[FLOAT_MAT42] = {size: 16, setter: matAttribSetter, count: 4};

  // src/twgl/framebuffers.js
  var DEPTH_COMPONENT3 = 6402;
  var RGBA42 = 32854;
  var RGB5_A12 = 32855;
  var RGB5652 = 36194;
  var DEPTH_COMPONENT163 = 33189;
  var STENCIL_INDEX = 6401;
  var STENCIL_INDEX8 = 36168;
  var DEPTH_STENCIL3 = 34041;
  var DEPTH_ATTACHMENT2 = 36096;
  var STENCIL_ATTACHMENT = 36128;
  var DEPTH_STENCIL_ATTACHMENT2 = 33306;
  var attachmentsByFormat = {};
  attachmentsByFormat[DEPTH_STENCIL3] = DEPTH_STENCIL_ATTACHMENT2;
  attachmentsByFormat[STENCIL_INDEX] = STENCIL_ATTACHMENT;
  attachmentsByFormat[STENCIL_INDEX8] = STENCIL_ATTACHMENT;
  attachmentsByFormat[DEPTH_COMPONENT3] = DEPTH_ATTACHMENT2;
  attachmentsByFormat[DEPTH_COMPONENT163] = DEPTH_ATTACHMENT2;
  var renderbufferFormats = {};
  renderbufferFormats[RGBA42] = true;
  renderbufferFormats[RGB5_A12] = true;
  renderbufferFormats[RGB5652] = true;
  renderbufferFormats[DEPTH_STENCIL3] = true;
  renderbufferFormats[DEPTH_COMPONENT163] = true;
  renderbufferFormats[STENCIL_INDEX] = true;
  renderbufferFormats[STENCIL_INDEX8] = true;

  // src/prog.ts
  console.log("mset", mSet([1, 2, 3], {1: 5}));
  var width = 800;
  var height = 800;
  var C = document.getElementById("C");
  C.width = width;
  C.height = height;
  glContext(C);
  console.log("voices", speechSynthesis.getVoices());
  var vFullScreenQuad = gl2Shader(VERTEX_SHADER, shaders_default.screenQuad);
  var textures2 = [0, 1].map((_) => [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map((tex) => glTexture(width, height, tex)));
  var buffers = textures2.map((textures3) => glFramebuffer(textures3));
  var t = 0;
  var pm = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, `${shaders_default.gradient}
${shaders_default.main}`));
  var pmUniform = glUniforms(pm);
  var ps = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders_default.screen));
  var psUniform = glUniforms(ps);
  var fov = 50 * Math.PI / 180;
  var aspect = width / height;
  var zNear = 0.5;
  var zFar = 800;
  var projection = mPerspective(fov, aspect, zNear, zFar);
  var camera = mLook([0, 0, 1]);
  var view = mInverse(camera);
  var viewProjection = mMul(projection, view);
  var projection2 = m4_exports.perspective(fov, aspect, zNear, zFar);
  var camera2 = m4_exports.lookAt([0, 0, 0], [0, 0, 1], [0, 1, 0]);
  var view2 = m4_exports.inverse(camera2);
  var viewProjection2 = m4_exports.multiply(projection2, view2);
  console.log("p", mvMul(viewProjection, [0, 0, 10]));
  function loop() {
    gl.useProgram(pm);
    pmUniform.t(t);
    gl.bindFramebuffer(FRAMEBUFFER, buffers[1]);
    gl.drawBuffers([
      COLOR_ATTACHMENT0,
      COLOR_ATTACHMENT1
    ]);
    gl.clear(DEPTH_BUFFER_BIT);
    glDrawQuad();
    gl.useProgram(ps);
    glBindTextures(textures2[1], [psUniform.T0, psUniform.T1, psUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    glDrawQuad();
    buffers = buffers.reverse();
    textures2 = textures2.reverse();
    t++;
  }
  window.onclick = loop;
  loop();
})();
