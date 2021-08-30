import * as gc from "./glconst";
import { dictMap } from "./misc";
import * as shape from "./shape";

export let gl: WebGL2RenderingContext;
const debug = true;

type ShaderType = (0x8b31 | 0x8b30);

export function context(c: HTMLCanvasElement) {
  gl = c.getContext("webgl2");
  gl.enable(gc.DEPTH_TEST);
}

export function enableAll() {
  gl.getSupportedExtensions().forEach(ex => gl.getExtension(ex));
}

export function shader(mode: ShaderType, body: string) {
  let src =
    `#version 300 es
precision highp float;
precision highp int;

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

export function showErrors() {
  let error = gl.getError();
  if (error) {
    console.log("gl error", error);
  }
}

export function glErrors() {

}

export function compile(vs: string, fs: string) {
  var program = gl.createProgram();
  gl.attachShader(program, shader(gc.VERTEX_SHADER, vs));
  gl.attachShader(program, shader(gc.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  return program;
}

export const
  TEX_RGBA16F = [gc.FLOAT, gc.RGBA, gc.RGBA16F],
  TEX_RGBA = [gc.UNSIGNED_BYTE, gc.RGBA],
  TEX_DEPTHS = [gc.UNSIGNED_SHORT, gc.DEPTH_COMPONENT, gc.DEPTH_COMPONENT16],
  TEX_DEPTHI = [gc.UNSIGNED_INT, gc.DEPTH_COMPONENT, gc.DEPTH_COMPONENT24],
  TEX_DEPTHF = [gc.FLOAT, gc.DEPTH_COMPONENT, gc.DEPTH_COMPONENT32F],
  TEX_DEPTH_STENCILF = [gc.FLOAT_32_UNSIGNED_INT_24_8_REV, gc.DEPTH_STENCIL, gc.DEPTH32F_STENCIL8];

export type Texture = { texture: WebGLTexture, format: number[] }

export function texture(width: number, height: number, format: number[], source?: any) {
  const texture = gl.createTexture();
  gl.bindTexture(gc.TEXTURE_2D, texture);

  gl.texImage2D(
    gc.TEXTURE_2D,
    0,
    format[2] || format[1],
    width,
    height,
    0,
    format[1],
    format[0],
    source
  );

  gl.texParameteri(gc.TEXTURE_2D, gc.TEXTURE_MIN_FILTER, gc.NEAREST);
  gl.texParameteri(gc.TEXTURE_2D, gc.TEXTURE_MAG_FILTER, gc.NEAREST);

  gl.bindTexture(gc.TEXTURE_2D, null);

  return { texture, format } as Texture;
}


export function renderbuffer(width: number, height: number) {
  const rb = gl.createRenderbuffer();
  gl.bindRenderbuffer(gc.RENDERBUFFER, rb);
  gl.renderbufferStorage(gc.RENDERBUFFER, gc.DEPTH_COMPONENT16, width, height);
  gl.bindRenderbuffer(gc.RENDERBUFFER, null);
  return rb;
}

export function framebuffer(textures: Texture[]) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gc.FRAMEBUFFER, fb);

  for (let i = 0; i < textures.length; i++) {
    let format = textures[i].format[1];
    let attachment = format == gc.DEPTH_STENCIL ? gc.DEPTH_STENCIL_ATTACHMENT :
      format == gc.DEPTH_COMPONENT ? gc.DEPTH_ATTACHMENT
        : gc.COLOR_ATTACHMENT0 + i;
    gl.framebufferTexture2D(
      gc.FRAMEBUFFER,
      attachment,
      gc.TEXTURE_2D,
      textures[i].texture,
      0
    );
  }

  gl.bindFramebuffer(gc.FRAMEBUFFER, null);

  return fb;
}

export function textures(formats: number[][], [width, height]: [number, number]) {
  return formats.map(
    (format) => texture(width, height, format)
  );
}

export function bindTextures(textures: Texture[], uniforms: ((n: number) => void)[]) {
  for (let i = 0; i < textures.length; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    uniforms[i] && uniforms[i](i);
    gl.bindTexture(gc.TEXTURE_2D, textures[i].texture);
  }
}

export function drawQuad() {
  gl.drawArrays(gc.TRIANGLES, 0, 6)
}

/**TODO: autogen all types */
const uniformTypes = { [gc.INT]: "i", [gc.UNSIGNED_INT]: "ui", [gc.FLOAT]: "f", [gc.FLOAT_VEC3]: "f", [gc.FLOAT_MAT4]: "Matrix4fv" }

export type Uniforms = {  [field: string]: (...args: any[]) => void;};

/**Creates dict of uniform setters*/
export function uniforms(p: WebGLProgram): Uniforms {
  const u: { [field: string]: (...args: any[]) => void } = {};
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
    const info = gl.getActiveUniform(p, i);
    //@ts-ignore
    let suffix: string = uniformTypes[info.type] || "i";
    const loc = gl.getUniformLocation(p, info.name);
    if (suffix.indexOf("Matrix") >= 0)
      //@ts-ignore
      u[info.name] = (...args) => gl[`uniform${suffix}`](loc, false, ...args);
    else
      u[info.name] = (...args) => {
        if(args[0].length > 0)
          args = args[0];    
        //@ts-ignore         
        gl[`uniform${args.length}${suffix}`](loc, ...args);
      }
  }
  return u;
}

export function attributesInfo(p: WebGLProgram) {
  for (let i = 0; i < 10; i++) {
    const info = gl.getActiveAttrib(p, i);
    if (info)
      console.log(info, info.type.toString(16));
  }
}

export function attr(program: WebGLProgram, name: string, buffer: WebGLBuffer, itemSize = 3) {
  let loc = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(loc);
  gl.bindBuffer(gc.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(loc, itemSize, gc.FLOAT, false, 0, 0);
}

export function readTextureData(texture: WebGLTexture, width: number, height: number) {
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

/** Data buffers **/

export type ShapeBuffers = { faces: WebGLBuffer, verts: { [k: string]: WebGLBuffer }, attrs: { [k: string]: number } };

export function databuffer() {
  return gl.createBuffer();
}

export function createDatabuffers(attrs: { [k: string]: number } = shape.defaultAttrs) {
  return { faces: databuffer(), verts: dictMap(attrs, _ => databuffer()), attrs: attrs } as ShapeBuffers;
}

export function setDatabuffer(buffer: WebGLBuffer, data: BufferSource, bindingPoint = gc.ARRAY_BUFFER) {
  gl.bindBuffer(bindingPoint, buffer);
  gl.bufferData(bindingPoint, data, gc.STATIC_DRAW);
}

export function setDatabuffers(buffers: ShapeBuffers, elements: shape.Elements) {
  setDatabuffer(buffers.faces, elements.faces, gc.ELEMENT_ARRAY_BUFFER)
  for (let k in elements.verts)
    setDatabuffer(buffers.verts[k], elements.verts[k]);
}

export function setAttrDatabuffers(buffers: ShapeBuffers, prog: WebGLProgram) {
  for (let key in buffers.verts)
    attr(prog, key, buffers.verts[key], buffers.attrs[key]);
}

export function putShapesInElementBuffers(shapes: shape.Shape[], attrs: { [k: string]: number }) {
  let elements = shape.shapesToElements(shapes, attrs);
  let bufs = createDatabuffers(attrs);
  setDatabuffers(bufs, elements);
  return [bufs, elements] as [ShapeBuffers, shape.Elements];
}
