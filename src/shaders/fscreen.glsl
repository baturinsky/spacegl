uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;

out vec4 c;

int bayer[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);
int b64[64] = int[] (1,33,9,41,3,35,11,43,49,17,57,25,51,19,59,27,13,45,5,37,15,47,7,39,61,29,53,21,63,31,55,23,4,36,12,44,2,34,10,42,52,20,60,28,50,18,58,26,16,48,8,40,14,46,6,38,64,32,56,24,62,30,54,22);

void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  c = vec4(0.);
  float depth = texelFetch(Depth, F, 0).r;
  c.rgb = vec3(texelFetch(T0, F, 0).r*65. > float(b64[F.y%8*8 + F.x%8])?1.:0.);
  //c.rgb = vec3(texelFetch(T0, F, 0).r*65. > float(F.y/1000%65));
  //c.rgb = vec3(1. + sin(float(F.y)*2000.));
  float diff = 0.;
  for(int i = 0; i < 4; i++) {
    float edge = texelFetch(Depth, F + ivec2(i % 2, i / 2), 0).r + texelFetch(Depth, F - ivec2(i % 2, i / 2), 0).r - depth * 2.;
    diff += abs(edge);
  }
  if(diff > .00005)
    c.rgb = vec3(0.);
  if(depth == 1.)
    c.rgb = vec3(1.);
  c.a = 1.;
}