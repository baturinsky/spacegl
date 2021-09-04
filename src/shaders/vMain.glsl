uniform mat4 camera;
uniform mat4 flyer;
uniform vec3 sun;

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

void main() {
  vat = at;
  vnorm = norm;
  vcell = cell;
  
  vtype = ivec4(type);
  vshape = int(shape);

  vec4 at4 = vec4(at, 1.);

  //int si = int(shape);

  if(vshape > 0)
    //vcolor.rgb = vec3(shape/10000., mod(shape,100.)/100., mod(shape,10.)/10.) * 1.5;
    vcolor.rgb = vec3(1.);
  else
    vcolor.rgb = vec3(.9);
  //color = vec4(1., 1., 0., 1.);

  if(vtype.x == 3 ){
    at4 = flyer * at4;
    mat4 fnorm = flyer;
    fnorm[3] = vec4(0.);
    vnorm = (fnorm * vec4(norm,1.)).xyz;
  }

  vec4 pos = camera * at4;
  vat = at4.xyz;
  pos.y = -pos.y;

  //vec3 toSun = sun - vat;
  vec3 toSun = vec3(0,1000,0);
  light = dot(vnorm, normalize(toSun)) * 0.2 + .9 - length(toSun) * .00014;

  dist = distance(vat, flyer[3].xyz);

  gl_Position = pos;
}