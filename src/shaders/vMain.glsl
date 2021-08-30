uniform mat4 camera;
uniform mat4 flyer;

in vec3 at;
in vec3 norm;
in vec3 cell;
in float type;
in float shape;

out vec3 vcell;
out vec3 vat;

flat out vec3 vnorm;
flat out float vtype;
flat out float vshape;
flat out vec4 vcolor;

void main() {
  vat = at;
  vnorm = norm;
  vcell = cell;
  vtype = type;
  vshape = shape;

  vec4 pos = vec4(at, 1.);

  //int si = int(shape);

  if(shape > 0.)
    //vcolor.rgb = vec3(shape/10000., mod(shape,100.)/100., mod(shape,10.)/10.) * 1.5;
    vcolor.rgb = vec3(1.);
  else
    vcolor.rgb = vec3(.9);
  //color = vec4(1., 1., 0., 1.);

  if(floor(type) == 3. ){
    pos = flyer * pos;
    mat4 fnorm = flyer;
    fnorm[3] = vec4(0.);
    vnorm = (fnorm * vec4(norm,1.)).xyz;
  }

  pos = camera * pos;
  pos.y = -pos.y;

  gl_Position = pos;
}