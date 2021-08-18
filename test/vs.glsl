#version 300 es
precision highp float;

const vec3 norm[6] = vec3[](vec3(1,0,0), vec3(-1,0,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,-1));
const vec2 uv[4] = vec2[](vec2(0,0), vec2(0,1), vec2(1,1), vec2(1,0));
const uint u255 = uint(255);

struct Light{
  vec3 pos;
  vec4 color;
};

uniform Light u_light[1];

uniform mat4 u_worldViewProjection;

uniform vec4 u_lightColor;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;
uniform float u_time;

in vec4 position;
in vec3 normals;
in vec2 texcoord;
in uint color;

out vec4 v_position;
out vec4 v_worldPosition;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;
out vec4 v_color;
out vec2 v_uv;

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
		oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
		0.0,                                0.0,                                0.0,                                1.0
	);
}


void main() {
  //mat4 rot = rotation3d(vec3(0., 0., 0.5), u_time * 0. );
  vec4 t_position = position;

  v_uv = uv[int(mod(float(gl_VertexID),4.))];

  v_position = u_worldViewProjection * t_position;
  //v_normal = normalize(u_worldInverseTranspose * vec4(normals, 0)).xyz;

  v_normal = normals;

  v_worldPosition = t_position;

  v_surfaceToLight = normalize(u_light[0].pos - (u_world * t_position).xyz);
  v_surfaceToView = normalize((u_viewInverse[3] - (u_world * t_position)).xyz);
  
  v_color = vec4(float((color>>16)&u255)/255., float((color>>8)&u255)/255., float(color&u255)/255., 1.0);
  gl_Position = v_position;
}
