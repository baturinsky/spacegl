uniform float t;
layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;
void main() {
  float v = fbm(gl_FragCoord.xy / 50. + vec2(0, t * 10.));
  c0 = vec4(0, v, 0, 1);
  float w = fbm(gl_FragCoord.xy / 200. + vec2(0, t * 10.)) - 0.5;
  w = .5 / (1. + w * w * 4e2);
  c1 = vec4(0, w, 0, 1);
  gl_FragDepth = 0.3;
}
