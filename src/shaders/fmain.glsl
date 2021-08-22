uniform float t;

flat in vec3 normal;
in vec4 uv;

layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;

void main() {
  float light = dot(normal, normalize(vec3(-1.,-2.,3.))) + 0.5;
  light += fract(uv.y)>0.1 && fract(uv.y)<0.9 && fract(uv.x)>0.1 && fract(uv.x)<0.9 && fract(uv.y*10.)>0.3 && fract(uv.x*10.)>0.3?-1.:.0;
  /*if(mod(uv.x,0.2)<0.1 != mod(uv.y,0.2)<0.1)
    light /= 2.;*/
  c0 = vec4(vec3(light), 1.);
  c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);
}
