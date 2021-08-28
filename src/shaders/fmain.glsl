uniform float t;
uniform vec3 sun;

flat in vec3 normal;
flat in float cellType;
in vec3 uv;

layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;

void main() {
  float light = dot(normal, sun)*0.5+.5;
  if(cellType == 2.)
    light += fract(uv.y)>0.1 && fract(uv.y)<0.9 && fract(uv.x)>0.1 && fract(uv.x)<0.9 && fract(uv.y*10.)>0.3 && fract(uv.x*10.)>0.3?-1.:.0;
  if(light>0.)
    light += uv.y*0.05 - 0.3;
  /*if(mod(uv.x,0.2)<0.1 != mod(uv.y,0.2)<0.1)
    light /= 2.;*/
  c0 = vec4(vec3(light), 1.);
  c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);
}
