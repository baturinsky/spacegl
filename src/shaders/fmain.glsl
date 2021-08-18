uniform float t;

flat in vec3 normal;
in vec2 uv;

layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;

void main() {
  //c0 = vec4(normal*0.5+0.5, 1.);  
  float light = dot(normal, normalize(vec3(1.,1.,3.)));
  c0 = vec4(vec3(light), 1.);
  c1 = vec4(sin(gl_FragCoord.y*.5)+.5, 0., 0., 1.);
}
