uniform mat4 camera;

in vec3 vert;
in vec3 norm;

out vec2 uv;
flat out vec3 normal;

void main() {  
  vec4 glpos = camera * vec4(vert, 1.);  
  glpos.y = - glpos.y;
  gl_Position = glpos / glpos.w;
  uv = vert.xy*0.5 + vec2(0.5);
  normal = norm;
}