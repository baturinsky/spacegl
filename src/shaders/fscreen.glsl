uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;

out vec4 c;

int bayer[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);
int b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);

void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  c = vec4(0.);
  float depth = texelFetch(Depth, F, 0).r;
  float lut;

  if(depth == 1.) {
    lut = 1.;
  } else {
    float lit = texelFetch(T0, F, 0).r;

    float diff = 0.;
    for(int i = 0; i < 8; i++) {
      int step = i/4;
      float edge = texelFetch(Depth, F + ivec2(i % 2, i % 4 / 2)*step, 0).r + texelFetch(Depth, F - ivec2(i % 2, i % 4 / 2)*step, 0).r - depth * 2.;
      diff += abs(edge);
    }

    if(diff > .00007) {
      //lut = lit>0.1?0.:1.;
      lut = 0.;
    } else {
      lut = lit * 65. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;
      //lut = lit;
    }
  }

  c.rgb = vec3(lut);

  //c.rgb = texelFetch(T0, F, 0).rgb;

  /*if(texelFetch(T1, F, 0).r == 1.)
    c.rgb = vec3(0., 0., 1.);*/
  c.a = 1.;
}