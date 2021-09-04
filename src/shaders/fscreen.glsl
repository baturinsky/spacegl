uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;
uniform mat4 invCamera;
uniform mat4 flyer;

in vec2 uv;

out vec4 color;

int b16[16] = int[] (1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6);
int b64[64] = int[] (1, 33, 9, 41, 3, 35, 11, 43, 49, 17, 57, 25, 51, 19, 59, 27, 13, 45, 5, 37, 15, 47, 7, 39, 61, 29, 53, 21, 63, 31, 55, 23, 4, 36, 12, 44, 2, 34, 10, 42, 52, 20, 60, 28, 50, 18, 58, 26, 16, 48, 8, 40, 14, 46, 6, 38, 64, 32, 56, 24, 62, 30, 54, 22);

float dither(float v, ivec2 F) {
  return v * 75. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;
}

const bool ditherOn = true;

void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  float depth = texelFetch(Depth, F, 0).r;
  color = vec4(1.);

  if(depth == 1.) {
    //color = vec4(texelFetch(T1, F, 0).rgb, 1.);
    vec4 pos4 = invCamera * vec4(uv * 2. - 1., depth * 2. - 1., 1.);
    vec3 pos = (pos4 / pos4.w).xyz - flyer[3].xyz;
    pos = pos / length(pos);
    //color.xyz = vec3(sin((pos.x + pos.y)*1e1)>0.9?1.:0.);
    //color.xyz = pos / 100.;
    //float a = atan(pos.x, pos.y);
    //color.xyz = sin(pos.x * 5e2) > 0.95 || sin(pos.y * 5e2) > 0.95 || sin(pos.z * 5e2) > 0.95 ? pos * 0.5 + 0.5 : vec3(0.);

    color.xyz = sin(pos.z * 5e2) > 0.85 && sin(pos.x * 5e2) > 0.85 ? pos * 0.5 + 0.5 : vec3(0.);;

    //color = vec4(uv, depth, 1.);
  } else {
    color = texelFetch(T0, F, 0);

    if(color.r > 0.)
      color = (color * 2. + texelFetch(T0, F + ivec2(1, 0), 0) + texelFetch(T0, F + ivec2(0, 1), 0)) * 0.25;

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
      if(ditherOn) {
        color.r = dither(color.r, F);
        color.g = dither(color.g, F);
        color.b = dither(color.b, F);
      }
      //lit = lit * 15. > float(b16[F.y % 4 * 4 + F.x % 4]) ? 1. : 0.;
      //lut = lit;
    }

    if(depth > 0.995 && (depth - 0.99) * 1000. > float(b64[F.y % 8 * 8 + F.x % 8])) {
      //color = vec4(1.);
    }

    /*if(depth > 0.99){
      color.rgb += (depth - 0.99) * 10.;
    }*/

  }

  //color = vec4(texelFetch(T1, F, 0).rgb, 1.);

  //c.rgb = texelFetch(T0, F, 0).rgb;

  /*if(texelFetch(T1, F, 0).r == 1.)
    c.rgb = vec3(0., 0., 1.);*/
  color.a = 1.;
}