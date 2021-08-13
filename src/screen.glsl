uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;
out vec4 c;
void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  c = vec4(texelFetch(T0, F, 0).g, texelFetch(T1, F, 0).g, texelFetch(Depth, F, 0).r*1., 1.);
  c.a = 1.;
}