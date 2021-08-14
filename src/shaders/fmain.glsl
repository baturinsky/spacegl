uniform float t;
layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;
void main() {
  c0 = vec4(sin(gl_FragCoord.x), 0., t*0., 1.);  
  c1 = vec4(sin(gl_FragCoord.y), 0., 0., 1.);
}
