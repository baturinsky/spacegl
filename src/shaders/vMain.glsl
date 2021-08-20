uniform mat4 camera;

in vec3 vert;
in vec3 norm;
in vec4 etc;

out vec4 uv;
flat out vec3 normal;

void main() {
  vec4 glpos = camera * vec4(vert, 1.);
  glpos.y = -glpos.y;
  gl_Position = glpos / glpos.w;
  //int i = gl_VertexID % 6;
  //uv = vec2(foo[i * 2], foo[i * 2 + 1]);
  uv = etc;
  normal = norm;
}