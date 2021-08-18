uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;

out vec4 c;

int bayer[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);

void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  c = vec4(0.);
  float depth = texelFetch(Depth, F, 0).r;
  c.rgb = vec3(texelFetch(T0, F, 0).r*16.5 > float(bayer[F.y%4*4 + F.x%4])?1.:0.);
  float diff = 0.;
  for(int i = 0; i < 4; i++) {
    float edge = texelFetch(Depth, F + ivec2(i % 2, i / 2), 0).r + texelFetch(Depth, F - ivec2(i % 2, i / 2), 0).r - depth * 2.;
    diff += abs(edge);
  }
  if(diff > .0001)
    c.rgb = vec3(0.);
  if(depth == 1.)
    c.rgb = vec3(1.);
  c.a = 1.;
}