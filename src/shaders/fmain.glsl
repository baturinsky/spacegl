uniform float t;

in vec3 vcell;
in vec3 vat;
in float dist;

flat in float light;
flat in vec3 vnorm;
flat in vec4 vcolor;

flat in ivec4 vtype;
flat in int vshape;

layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;

float hexDigitF(int n, int place) {
  return float((n >> (place * 4)) & 15) / 15.;
}

int hex2Digit(int n, int place) {
  return (n >> (place * 8)) % 256;
}

void main() {
  //vec4 worldAt = 
  int itype = vtype.x;
  int t1 = vtype.y;
  int t2 = vtype.z;
  float bright = light;
  //vt = 2.0101000000;
  if(itype == 2) {
    float hm = hexDigitF(t2, 0);
    float vm = hexDigitF(t2, 1);
    float x = fract(vcell.x);
    float y = fract(vcell.y);

    if(dist > 500.) {
      //bright *= float(vtype.a)/256.;
      bright += x > hm &&
        x < 1. - hm &&
        y > vm &&
        y < 1. - vm ? -float(vtype.a) / 256. : .0;

    } else {
      float cols = float(hex2Digit(t1, 1));
      float rows = float(hex2Digit(t1, 0));
      float hb = hexDigitF(t2, 2);
      float vb = hexDigitF(t2, 3);
      bright += x > hm &&
        x < 1. - hm &&
        y > vm &&
        y < 1. - vm &&
        (cols == 1. || fract((x - hm) / (1. - hm*2.) * cols) > hb) &&
        (rows ==1. || fract((y - vm) / (1. - vm*2.) * rows) > vb) ? -1. : .0;
    }
  } else if(itype == 4) {
    bright += vat.z * 5e-4 + (fract(vat.y / 20. + 0.55) < .1 || fract(atan(vat.x, vat.z) / 3.141 * 70.) < .1 ? -1. : 0.);
  } else if(itype == 5) {
    bright = 2.;
  }

  if(bright > 0.)
    bright += vcell.y * 0.05 - 0.3;
  /*if(mod(vcell.x,0.2)<0.1 != mod(vcell.y,0.2)<0.1)
    light /= 2.;*/
  //c0 = vec4(light, 0., 0., 1.);
  c0 = vec4(vcolor.rgb * bright, vcolor.a);
  //c1 = vec4(gl_FrontFacing?0.:1.,0.,0.,0.);
  c1 = vec4(vat / 1000. + 0.5, 1.);
  //c1 = vec4(1.,0.,0.,1.);
}
