uniform float time;

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

float rand(float n){return fract(sin(n) * 43758.5453123);}

bool animationSinus(vec2 uv, float time, float variant){
  return fract(sin(uv.x * 13.)/sin(uv.y * 11.) * (.5 + rand(variant * 300.)) + 0.1 * time * (1. + variant)) > variant + 0.1;
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
    float y = vat.y / 10.;
    float a = atan(vat.x, vat.z) / 3.141 * 36. * 4.;
    bool yb = fract(y) < .2;
    bool ab = fract(a) < .2;
    bool r = rand(floor(y) * floor(a)) < 0.7;
    bright += vat.z * 5e-4 + (r && (ab || yb) || (ab&&yb) ? -1. : 0.);
  } else if(itype == 5) {
    bright = 2.;
  } else if(itype == 10) {
    if(vcell.y>1.1 && vcell.y<1.9 && (vcell.x>.1 && vcell.x < .9 || vcell.x>2.1 && vcell.x < 2.9)){
      float x = fract(vcell.x);
      float y = fract(vcell.y);
      bright = rand(floor(y * 15. + floor((x-0.1)*15.)*100. - time*5. + float(vshape)))>0.5?1.:0.;
    }
  } else if(itype == 7) {
    float y = fract(vcell.y);
    bright += y < 0.03 || y > 0.97 || y>0.49 && y<0.51? -.5 : .0;
  }

  if(bright > 0.)
    bright += vcell.y * 0.05 - 0.3;

  c0 = vec4(vcolor.rgb * bright, vcolor.a);
  c1 = vec4(vnorm*0.5+0.5, gl_FragCoord.z * gl_FragCoord.w);
}
