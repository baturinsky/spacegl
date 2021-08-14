void main() {
  int i = gl_VertexID;
  gl_Position = vec4(i%2*2-1, 1-(i+1)%4/2*2, 0., 1.);
}