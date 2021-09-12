uniform sampler2D T0;
uniform sampler2D T1;
uniform sampler2D Depth;
uniform mat4 invCamera;
uniform mat4 invPerspective;
uniform mat4 flyer;
uniform vec3 viewSize;
uniform vec3 scp0;
uniform vec3 scp1;
uniform vec3 scp2;
uniform float timeout;

in vec2 uv;

out vec4 color;

float Noise2d(in vec2 x) {
  float xhash = cos(x.x * 37.0);
  float yhash = cos(x.y * 57.0);
  return fract(415.92653 * (xhash + yhash));
}

int b64[64] = int[] (
  1, 34, 9, 41, 3, 32, 11, 43, 49, 
  16, 57, 25, 51, 19, 59, 27, 14, 
  45, 6, 37, 16, 47, 8, 39, 61, 
  31, 53, 21, 63, 31, 55, 23, 4, 
  35, 12, 44, 2, 34, 10, 42, 52, 
  20, 60, 28, 50, 18, 58, 26, 16, 
  48, 8, 40, 14, 46, 6, 38, 64, 
  31, 56, 24, 62, 31, 54, 22);

float dither(float v, ivec2 F) {
  return v * 75. > float(b64[F.y % 8 * 8 + F.x % 8]) ? 1. : 0.;
}

const bool ditherOn = true;
const float collisionDepth = 0.6;

void main() {

  ivec2 F = ivec2(gl_FragCoord.xy);

  float depth = texelFetch(Depth, F, 0).r;
  color = vec4(1.);

  vec4 screenPos = vec4(uv.x, -uv.y, depth * 2. - 1., 1.);

  vec4 pos4 = invCamera * screenPos;
  vec3 pos = (pos4 / pos4.w).xyz - flyer[3].xyz;

  color = texelFetch(T0, F, 0);

  float r = 75.;
  bool ui = false;

  vec2 cntr = vec2(viewSize.x-r-10., viewSize.y - r-10.);
  vec2 dif = cntr - gl_FragCoord.xy;
  float l = length(dif);
  if(l < r) {
    float a = atan(-dif.x, dif.y);
    if(l>r*.7 && l<r && timeout > 0.){
      ui = true;
      color.xyz = a / 6.282 + 0.5 > timeout ? vec3(.01):vec3(1.);
    }
  }

  if(depth == 1. && !ui) {

    vec3 pos1 = pos / length(pos);

    if(Noise2d(vec2(floor((pos1.x + pos1.y) * 3e2), floor(pos1.z * 3e2))) > 0.99)
      color.xyz = pos1 * 0.5 + 0.5;
    else
      color.xyz = vec3(0.);

  } else {

    if(color.r > 0.)
      color = (color * 2. + texelFetch(T0, F + ivec2(1, 0), 0) + texelFetch(T0, F + ivec2(0, 1), 0)) * 0.25;

    float diff = 0.;
    for(int i = 0; i < 8; i++) {
      int step = i / 4;
      ivec2 place = ivec2(i % 2, i % 4 / 2) * step;
      float edge = texelFetch(Depth, F + place, 0).r +
        texelFetch(Depth, F - place, 0).r - depth * 2.;
      diff += abs(edge);
    }

    diff *= depth;

    if(diff > .00007) {
      color.rgb = normalize(color.rgb) * 0.3;
    } else {
      if(ditherOn) {
        color.r = dither(color.r, F);
        color.g = dither(color.g, F);
        color.b = dither(color.b, F);
      }
    }

    if(depth > 0.995 && (depth - 0.99) * 1000. > float(b64[F.y % 8 * 8 + F.x % 8])) {
      color = vec4(1.);
    }
  }

  /*color.rgb = vec3((uv.x*0.5 + 0.5)/16.+7./16.);

  color.r = dither(color.r, F);
  color.g = dither(color.g, F);
  color.b = dither(color.b, F);*/

  //color = texelFetch(T1, F, 0);
  color.a = 1.;
}