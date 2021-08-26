uniform mat4 camera;

in vec3 at;
in vec3 norm;
in vec3 uv;

out vec3 fuv;
flat out vec3 normal;

void main() {
  vec4 glpos = camera * vec4(at, 1.);
  glpos.y = -glpos.y;
  gl_Position = glpos / glpos.w;
  //int i = gl_VertexID % 6;
  //uv = vec2(foo[i * 2], foo[i * 2 + 1]);
  fuv = uv;
  normal = norm;
}