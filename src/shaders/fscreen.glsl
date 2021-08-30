uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;

out vec4 color;

int b16[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);
int b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);

float dither(float v, ivec2 F) {
  return v * 75. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;
}

void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  float depth = texelFetch(Depth, F, 0).r;
  color = vec4(0.);

  if(depth == 1.) {
    //c = vec4(texelFetch(T1, F, 0).rgb, 1.);
    color = vec4(1., 1., 1., 1.);
  } else {
    color = texelFetch(T0, F, 0);

    float diff = 0.;
    for(int i = 0; i < 8; i++) {
      int step = i / 4;
      float edge = texelFetch(Depth, F + ivec2(i % 2, i % 4 / 2) * step, 0).r + texelFetch(Depth, F - ivec2(i % 2, i % 4 / 2) * step, 0).r - depth * 2.;
      diff += abs(edge);
    }

    if(diff > .00007) {
      //lut = lit>0.1?0.:1.;
      color.rgb = normalize(color.rgb) * 0.3;
    } else {
      color.r = dither(color.r, F);
      color.g = dither(color.g, F);
      color.b = dither(color.b, F);
      //lit = lit * 15. > float(b16[F.y % 4 * 4 + F.x % 4]) ? 1. : 0.;
      //lut = lit;
    }

    if(depth > 0.99 && (depth - 0.99) * 2000. > float(b64[F.y % 8 * 8 + F.x % 8])) {
      color = vec4(1.);
    }

    /*if(depth > 0.99){
      color.rgb += (depth - 0.99) * 10.;
    }*/


  }

  //c.rgb = texelFetch(T0, F, 0).rgb;

  /*if(texelFetch(T1, F, 0).r == 1.)
    c.rgb = vec3(0., 0., 1.);*/
  color.a = 1.;
}