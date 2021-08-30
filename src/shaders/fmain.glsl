uniform float t;
uniform vec3 sun;

in vec3 vcell;
in vec3 vat;

flat in vec3 vnorm;
flat in float vtype;
flat in float vshape;
flat in vec4 vcolor;

layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;

void main() {
  float light = dot(vnorm, sun)*0.5+.5;
  if(vtype == 2.)
    light += fract(vcell.y)>0.1 && fract(vcell.y)<0.9 && fract(vcell.x)>0.1 && fract(vcell.x)<0.9 && fract(vcell.y*10.)>0.3 && fract(vcell.x*10.)>0.3?-1.:.0;
  if(light>0.)
    light += vcell.y*0.05 - 0.3;
  /*if(mod(vcell.x,0.2)<0.1 != mod(vcell.y,0.2)<0.1)
    light /= 2.;*/
  //c0 = vec4(light, 0., 0., 1.);
  c0 = vec4(vcolor.rgb * light, vcolor.a);
  //c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);
  c1 = vec4(vat/1000. + 0.5, 0);
}
