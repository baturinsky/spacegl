uniform mat4 camera;
uniform mat4 flyer;
uniform vec3 sun;
uniform float time;
uniform int consuming;
uniform float consumingStage;

uniform int liveDebris[32];

in vec3 at;
in vec3 up;
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

  vec4 at4 = vec4(at+up*0., 1.);

  vcolor.rgb = vec3(1.);

  if(vtype.x == 9) {
    int swarm = vshape/32;
    bool live = (liveDebris[swarm/30] & (1 << swarm%30)) != 0;
    if(live || consuming == swarm){
      vcolor.rgb = vec3(1.,0.,1.);
      float a = rand(shape);
      vec3 axis = normalize(vec3(rand(a+1.), rand(a+2.), rand(a+3.)));
      light -= a*0.3; 
      mat4 rot = axisRotation(axis, time * 5. * (.5+rand(a+4.)) + rand(a+4.) );
      vnorm = normalize((rot * vec4(norm, 1.)).xyz);
      at4 = rot * at4;
      at4.xyz += 25. * (vec3(rand(a+5.), rand(a+6.), rand(a+7.)) - .5);
      at4.xyz += vec3(vtype.yzw);
      at4.xyz += up * sin(float(swarm) + time*0.1) * 20.;
      if(consuming == swarm)
        at4.xyz = mix(at4.xyz, flyer[3].xyz, consumingStage);
    } else {
      at4 = vec4(1e6);
    }
  }

  if(vtype.x == 10) {
    if(vshape % 2 == 0) {
      mat4 rot = axisRotation(up, time);
      vnorm = normalize((rot * vec4(norm, 1.)).xyz);
      at4 = rot * at4;
    } else {
      at4.xyz += up * sin(float(vshape) + time) * 20.;
    }
    at4.xyz += vec3(vtype.yzw);
  }

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
    float shift = fract(fract(float(id) / 1e2) + time * 1e-2 * (id % 2 == 1 ? 3. : -3.));
    at4.y = at4.y + 7300. - pow(shift * 120., 2.);
    if(at4.y<0.){
      at4.xz += vec2(rand(float(id))-.5,rand(float(id+1))-.5) * pow(at4.y/1e2,2.) ;
    }
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
  light = dot(vnorm, normalize(toSun)) * 0.2 + .9 - length(toSun) * 1e-6;

  if(vtype.x == 7) {
    light += 0.2;
  }

  dist = distance(vat, flyer[3].xyz);

  gl_Position = pos;
}
