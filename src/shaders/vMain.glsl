uniform mat4 camera;
uniform mat4 flyer;
uniform vec3 sun;
uniform float time;

in vec3 at;
in vec3 norm;
in vec3 cell;
in vec4 type;
in float shape;

out vec3 vcell;
out vec3 vat;
out float dist;
flat out float light;

flat out vec3 vnorm;
flat out vec4 vcolor;

flat out ivec4 vtype;
flat out int vshape;

float rand(float n){return fract(sin(n) * 43758.5453123);}

mat4 axisRotation(vec3 axis, float angle) {

  float x = axis.x;
  float y = axis.y;
  float z = axis.z;

  float n = sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  float c = cos(angle);
  float s = sin(angle);
  float omc = 1. - c;

  return mat4(x * x + (1. - x * x) * c, x * y * omc + z * s, x * z * omc - y * s, 0., x * y * omc - z * s, y * y + (1. - y * y) * c, y * z * omc + x * s, 0., x * z * omc + y * s, y * z * omc - x * s, z * z + (1. - z * z) * c, 0., 0., 0., 0., 1.);
}

void main() {
  vat = at;
  vnorm = norm;
  vcell = cell;

  vtype = ivec4(type);
  vshape = int(shape);

  vec4 at4 = vec4(at, 1.);

  if(vtype.x == 9) {
    float a = rand(shape);
    vec3 axis = normalize(vec3(rand(a+1.), rand(a+2.), rand(a+3.)));
    //vec3 axis = vec3(1.,0.,0.);   
    light -= a*0.3; 
    at4 = axisRotation(axis, time * 5e-3 * (.5+rand(a+4.)) + rand(a+4.) ) * at4;
    at4.xyz += 10. * (vec3(rand(a+5.), rand(a+6.), rand(a+7.)) - .5);
    at4.xyz += vec3(vtype.yzw);
  }

  //int si = int(shape);

  if(vshape > 0)
    //vcolor.rgb = vec3(shape/10000., mod(shape,100.)/100., mod(shape,10.)/10.) * 1.5;
    vcolor.rgb = vec3(1.);
  else
    vcolor.rgb = vec3(.9);
  //color = vec4(1., 1., 0., 1.);

  if(vtype.x == 3) {
    at4 = flyer * at4;
    mat4 fnorm = flyer;
    fnorm[3] = vec4(0.);
    vnorm = normalize((fnorm * vec4(norm, 1.)).xyz);
  }

  if(vtype.x == 7) {
    int id = vtype.y;
    if(id % 2 == 0) {
      vnorm.y = -vnorm.y;
      at4.y = -at4.y;
    }
    float shift = fract(fract(float(id) / 1e2) + time * 1e-5 * (id % 2 == 1 ? 3. : -3.));
    at4.y = at4.y + 7300. - pow(shift * 120., 2.);
  }

  vec4 pos;

  if(vtype.x == 8) {
    pos = at4;
  } else {
    pos = camera * at4;
  }

  vat = at4.xyz;
  pos.y = -pos.y;

  vec3 toSun = sun - vat;
  //vec3 toSun = vec3(0, 1000, 0);
  light = dot(vnorm, normalize(toSun)) * 0.2 + .9 - length(toSun) * 1e-6;

  if(vtype.x == 7) {
    light += 0.2;
  }

  dist = distance(vat, flyer[3].xyz);

  gl_Position = pos;
}
