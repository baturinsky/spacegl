uniform mat4 camera;

in vec3 at;
in vec3 norm;
in vec3 cell;
in float type;

out vec3 uv;
flat out vec3 normal;
flat out float cellType;

void main() {
  vec4 glpos = camera * vec4(at, 1.);
  glpos.y = -glpos.y;
  gl_Position = glpos / glpos.w;
  //int i = gl_VertexID % 6;
  //uv = vec2(foo[i * 2], foo[i * 2 + 1]);
  uv = cell;
  cellType = type;
  normal = norm;
}