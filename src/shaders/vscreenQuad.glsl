out vec2 uv;

void main() {
  int i = gl_VertexID;
  ivec2 uvi = ivec2(i % 2, (i + 1) % 4 / 2) * 2 - 1;
  gl_Position = vec4(uvi.x, uvi.y, 0, 1);
  uv = vec2(uvi);
  //gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);
}