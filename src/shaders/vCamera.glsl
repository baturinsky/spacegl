uniform mat4 camera;

in vec3 position;

out vec2 v_texCoord;

void main() {
  
  gl_Position = camera * vec4(position.xyz, 1.);
  v_texCoord = position.xy*0.5 + vec2(0.5);
}