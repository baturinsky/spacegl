(() => {
  // src/glconsts.js
  var DEPTH_BUFFER_BIT = 256;
  var TRIANGLES = 4;
  var TEXTURE_2D = 3553;
  var DEPTH_TEST = 2929;
  var UNSIGNED_BYTE = 5121;
  var UNSIGNED_SHORT = 5123;
  var INT = 5124;
  var DEPTH_COMPONENT = 6402;
  var RGBA = 6408;
  var FRAGMENT_SHADER = 35632;
  var VERTEX_SHADER = 35633;
  var NEAREST = 9728;
  var TEXTURE_MAG_FILTER = 10240;
  var TEXTURE_MIN_FILTER = 10241;
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
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
      const info = gl.getActiveUniform(p, i);
      let suffix = ["i", "ui", "f"][info.type - INT] || "i";
      const loc = gl.getUniformLocation(p, info.name);
      uniform[info.name] = (...args) => gl[`uniform${args.length}${suffix}`](loc, ...args);
    }
    return uniform;
  }

  // src/gradient.glsl
  var gradient_default = "int NUM_OCTAVES = 10;\n\n\n// 1,2,3\n\nfloat rand(vec2 n) { \n	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nfloat noise(vec2 p){\n	vec2 ip = floor(p);\n	vec2 u = fract(p);\n	u = u*u*(3.0-2.0*u);\n	\n	float res = mix(\n		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),\n		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);\n	return res*res;\n}\n\n\n/*\n// Simplex\n\nvec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }\n\nfloat noise(vec2 v){\n  const vec4 C = vec4(0.211324865405187, 0.366025403784439,\n           -0.577350269189626, 0.024390243902439);\n  vec2 i  = floor(v + dot(v, C.yy) );\n  vec2 x0 = v -   i + dot(i, C.xx);\n  vec2 i1;\n  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n  vec4 x12 = x0.xyxy + C.xxzz;\n  x12.xy -= i1;\n  i = mod(i, 289.0);\n  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n  + i.x + vec3(0.0, i1.x, 1.0 ));\n  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),\n    dot(x12.zw,x12.zw)), 0.0);\n  m = m*m ;\n  m = m*m ;\n  vec3 x = 2.0 * fract(p * C.www) - 1.0;\n  vec3 h = abs(x) - 0.5;\n  vec3 ox = floor(x + 0.5);\n  vec3 a0 = x - ox;\n  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n  vec3 g;\n  g.x  = a0.x  * x0.x  + h.x  * x0.y;\n  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n  return 0.5 + 130.0 * dot(m, g) * 0.5;\n}\n*/\n\nfloat fbm(vec2 x) {\n	float v = 0.0;\n	float a = 0.5;\n	vec2 shift = vec2(100);\n  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));\n	for (int i = 0; i < NUM_OCTAVES; ++i) {\n		v += a * noise(x);\n		x = rot * x * 2.0 + shift;\n		a *= 0.6;\n	}\n	return v;\n}\n";

  // src/main.glsl
  var main_default = "uniform float t;\nlayout(location = 0) out vec4 c0;\nlayout(location = 1) out vec4 c1;\nvoid main() {\n  float v = fbm(gl_FragCoord.xy / 50. + vec2(0, t * 10.));\n  c0 = vec4(0, v, 0, 1);\n  float w = fbm(gl_FragCoord.xy / 200. + vec2(0, t * 10.)) - 0.5;\n  w = .5 / (1. + w * w * 4e2);\n  c1 = vec4(0, w, 0, 1);\n  gl_FragDepth = 0.3;\n}\n";

  // src/screen.glsl
  var screen_default = "uniform sampler2D T0;\nuniform sampler2D T1;\nuniform sampler2D Depth;\nout vec4 c;\nvoid main() {\n  ivec2 F = ivec2(gl_FragCoord.xy);\n  c = vec4(texelFetch(T0, F, 0).g, texelFetch(T1, F, 0).g, texelFetch(Depth, F, 0).r*1., 1.);\n  c.a = 1.;\n}";

  // src/shaders.ts
  var shaders_default = {main: main_default, gradient: gradient_default, screen: screen_default};

  // src/math3d.ts
  var arr = (n) => [...new Array(n)].map((_, i) => i);
  var mI = arr(16).map((n) => n % 5 ? 0 : 1);
  var mSet = (m, s) => {
    m = [...m];
    for (let k in s)
      m[k] = s[k];
    return m;
  };
  var pie = (r, h, sectors) => {
    let vertices = [];
    vertices[sectors * 2] = [0, 0, 0];
    vertices[sectors * 2 + 1] = [0, h, 0];
    for (let i = 0; i < sectors; i++) {
      let a = Math.PI * 2 / sectors * i;
      let x = r * Math.sin(a);
      let z = r * Math.cos(a);
      vertices[i] = [x, 0, z];
      vertices[i + sectors] = [x, h, z];
    }
    let faces = [];
    for (let i = 0; i < sectors; i++) {
      faces[i * 4] = [sectors * 2, i, (i + 1) % sectors];
      faces[i * 4 + 1] = [sectors * 2 + 1, i + sectors, (i + 1) % sectors + sectors];
      faces[i * 4 + 2] = [i, (i + 1) % sectors, (i + 1) % sectors + sectors];
      faces[i * 4 + 3] = [i, i + sectors, (i + 1) % sectors];
    }
    console.log(JSON.stringify([vertices, faces]));
  };
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
    console.log(pie(10, 10, 4));
  };
  test();

  // src/prog.ts
  console.log("mset", mSet([1, 2, 3], {1: 5}));
  var width = 800;
  var height = 800;
  C.width = width;
  C.height = height;
  glContext(C);
  gl.getExtension("EXT_color_buffer_float");
  var vFullScreenQuad = gl2Shader(VERTEX_SHADER, `
void main() {
  int i = gl_VertexID;
  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, float(i%2*2-1)*2.+1., 1.);
}`);
  var textures = [0, 1].map((_) => [TEX_RGBA, TEX_RGBA, TEX_DEPTHS].map((tex) => glTexture(width, height, tex)));
  var buffers = textures.map((textures2) => glFramebuffer(textures2));
  var t = 0;
  var pm = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, `${shaders_default.gradient}
${shaders_default.main}`));
  var pmUniform = glUniforms(pm);
  var ps = glCompile(vFullScreenQuad, gl2Shader(FRAGMENT_SHADER, shaders_default.screen));
  var psUniform = glUniforms(ps);
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
    glBindTextures(textures[1], [psUniform.T0, psUniform.T1, psUniform.Depth]);
    gl.bindFramebuffer(FRAMEBUFFER, null);
    glDrawQuad();
    buffers = buffers.reverse();
    textures = textures.reverse();
    t++;
  }
  window.onclick = loop;
  loop();
})();
