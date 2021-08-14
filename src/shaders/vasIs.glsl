in vec4 position;

out vec4 v_position;
out vec2 v_texCoord;

void main() {
  gl_Position = position;
  v_texCoord = position.xy*0.5 + vec2(0.5);
}