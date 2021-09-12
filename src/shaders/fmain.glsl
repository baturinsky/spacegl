in vec3 vcell;
in vec3 vat;
in float dist;

flat in float light;
flat in vec3 vnorm;
flat in vec4 vcolor;

flat in ivec4 vtype;

layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;

float hexDigitF(int n, int place) {
  return float((n >> (place * 4)) & 15) / 15.;
}

int hex2Digit(int n, int place) {
  return (n >> (place * 8)) % 256;
}

void main() {
  int itype = vtype.x;
  int t1 = vtype.y;
  int t2 = vtype.z;
  float bright = light;
  if(itype == 2) {
    float hm = hexDigitF(t2, 0);
    float vm = hexDigitF(t2, 1);
    float x = fract(vcell.x);
    float y = fract(vcell.y);

    float far = 0., near = 0.;

    if(dist >= 500.) {
      far = x > hm &&
        x < 1. - hm &&
        y > vm &&
        y < 1. - vm ? -float(vtype.a) / 256. : .0;
    }

    if(dist <= 700.) {
      float cols = float(hex2Digit(t1, 1));
      float rows = float(hex2Digit(t1, 0));
      float hb = hexDigitF(t2, 2);
      float vb = hexDigitF(t2, 3);
      near = x > hm &&
        x < 1. - hm &&
        y > vm &&
        y < 1. - vm &&
        (cols == 1. || fract((x - hm) / (1. - hm * 2.) * cols) > hb) &&
        (rows == 1. || fract((y - vm) / (1. - vm * 2.) * rows) > vb) ? -1. : .0;
    }

    float l = clamp((dist - 500.) / 200., 0., 1.);
    bright += mix(near, far, l);

  } else if(itype == 4) {
    bright += vat.z * 5e-4 + (fract(vat.y / 40. + 0.55) < .1 || fract(atan(vat.x, vat.z) / 3.141 * 36. + 0.45) < .1 ? -1. : 0.);
  } else if(itype == 5) {
    bright = 2.;
  }

  if(itype == 7) {
    float y = fract(vcell.y);
    bright += y < 0.03 || y > 0.97 || y>0.49 && y<0.51? -.5 : .0;
  }

  if(bright > 0.)
    bright += vcell.y * 0.05 - 0.3;

  c0 = vec4(vcolor.rgb * bright, vcolor.a);
  c1 = vec4(vnorm*0.5+0.5, gl_FragCoord.z * gl_FragCoord.w);
}
