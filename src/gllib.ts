import { TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST, FRAMEBUFFER, COLOR_ATTACHMENT0, TRIANGLES, INT, FLOAT, RGBA, RGBA16F, STATIC_DRAW, ARRAY_BUFFER, RENDERBUFFER, UNSIGNED_BYTE, DEPTH_STENCIL_ATTACHMENT, DEPTH_COMPONENT16, DEPTH_ATTACHMENT, DEPTH_TEST, DEPTH_COMPONENT, UNSIGNED_SHORT, DEPTH_STENCIL, DEPTH_COMPONENT24, UNSIGNED_INT, DEPTH_COMPONENT32F, DEPTH24_STENCIL8, DEPTH32F_STENCIL8, FLOAT_32_UNSIGNED_INT_24_8_REV, TEXTURE_MAG_FILTER, FLOAT_MAT4 } from "./glconsts";

export let gl: WebGL2RenderingContext;
const debug = true;

type ShaderType = (0x8b31 | 0x8b30);

export function glContext(c: HTMLCanvasElement) {
  gl = c.getContext("webgl2");
  gl.enable(DEPTH_TEST);
}

export function glEnableAll(){
  gl.getSupportedExtensions().forEach(ex=>gl.getExtension(ex));
}

export function gl2Shader(mode: ShaderType, body: string) {
  let src =
    `#version 300 es
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

export function glShowErrors() {
  let error = gl.getError();
  if (error) {
    console.log("gl error", error);
  }
}

export function glErrors() {

}

export function glCompile(vs: WebGLProgram, fs: WebGLProgram) {
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

export const
  TEX_RGBA16F = [FLOAT, RGBA, RGBA16F],
  TEX_RGBA = [UNSIGNED_BYTE, RGBA],
  TEX_DEPTHS = [UNSIGNED_SHORT, DEPTH_COMPONENT, DEPTH_COMPONENT16],
  TEX_DEPTHI = [UNSIGNED_INT, DEPTH_COMPONENT, DEPTH_COMPONENT24],
  TEX_DEPTHF = [FLOAT, DEPTH_COMPONENT, DEPTH_COMPONENT32F],
  TEX_DEPTH_STENCILF = [FLOAT_32_UNSIGNED_INT_24_8_REV, DEPTH_STENCIL, DEPTH32F_STENCIL8];

export function glTexture(width: number, height: number, format: number[], source?) {
  const texture = gl.createTexture();
  gl.bindTexture(TEXTURE_2D, texture);

  gl.texImage2D(
    TEXTURE_2D,
    0,
    format[2] || format[1],
    width,
    height,
    0,
    format[1],
    format[0],
    source
  );

  texture["fmt"] = format;

  gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
  gl.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST);

  gl.bindTexture(TEXTURE_2D, null);

  return texture;
}


export function glRenderbuffer(width: number, height: number) {
  const rb = gl.createRenderbuffer();
  gl.bindRenderbuffer(RENDERBUFFER, rb);
  gl.renderbufferStorage(RENDERBUFFER, DEPTH_COMPONENT16, width, height);
  gl.bindRenderbuffer(RENDERBUFFER, null);
  return rb;
}

export function glFramebuffer(textures: WebGLTexture[]) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(FRAMEBUFFER, fb);

  for (let i = 0; i < textures.length; i++) {
    let format = textures[i]["fmt"] && textures[i]["fmt"][1];
    let attachment = format == DEPTH_STENCIL ? DEPTH_STENCIL_ATTACHMENT :
      format == DEPTH_COMPONENT ? DEPTH_ATTACHMENT
        : COLOR_ATTACHMENT0 + i;
    gl.framebufferTexture2D(
      FRAMEBUFFER,
      attachment,
      TEXTURE_2D,
      textures[i],
      0
    );
  }

  gl.bindFramebuffer(FRAMEBUFFER, null);

  return fb;
}

export function glBindTextures(textures: WebGLTexture[], uniforms) {
  for (let i = 0; i < textures.length; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    uniforms[i](i);
    gl.bindTexture(TEXTURE_2D, textures[i]);
  }
}

export function glDrawQuad() {
  gl.drawArrays(TRIANGLES, 0, 6)
}

export function glUniforms(p: WebGLProgram) {
  const uniform: { [field: string]: (...number) => void } = {};
  const types = {[INT]:"i", [UNSIGNED_INT]:"ui", [FLOAT]:"f", [FLOAT_MAT4]:"Matrix4fv"}
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
    const info = gl.getActiveUniform(p, i);
    console.log(info.name, info.type.toString(16));    
    let suffix:string = types[info.type] || "i";
    const loc = gl.getUniformLocation(p, info.name);
    if(suffix.indexOf("Matrix")>=0)
      uniform[info.name] = (...args) => gl[`uniform${suffix}`](loc, false, ...args);
    else
      uniform[info.name] = (...args) => gl[`uniform${args.length}${suffix}`](loc, ...args);
  }
  console.log(uniform);
  return uniform;
}


export function glDatabuffer() {
  return gl.createBuffer();
}

export function glSetDatabuffer(buffer:WebGLBuffer, data:BufferSource) {
  gl.bindBuffer(ARRAY_BUFFER, buffer);
  gl.bufferData(ARRAY_BUFFER, data, STATIC_DRAW);
}

export function glAttr(program, name, buffer, itemSize = 3) {
  let loc = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(loc);
  gl.bindBuffer(ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(loc, itemSize, FLOAT, false, 0, 0);
}


export function readTextureData(texture, width, height) {
  // Create a framebuffer backed by the texture
  var framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  // Read the contents of the framebuffer
  var data = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return data;
}