#version 150

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec3 spectrum;
uniform mat4 mvp;
uniform mat4 model;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out VertexData
{
    vec4 v_position;
    vec3 v_normal;
    vec2 v_texcoord;
} outData;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main(void)
{
#define PI 3.141592653
    mat4 rot = mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);
    //mat4 rot = rotationMatrix(vec3(0,1,0), sin(time/2)*(PI*0.05));
    //rot = rot * rotationMatrix(vec3(0,0,1), cos(time/20)*(PI));
    // Some drivers don't like position being written here
    // with the tessellation stages enabled also.
    // Comment next line when Tess.Eval shader is enabled.
    gl_Position = mvp * rot * a_position;

    outData.v_position = model * rot * a_position;
    outData.v_normal = vec3(model * rot * vec4(a_normal, 1));
    outData.v_texcoord = vec2(a_texcoord.x, 1-a_texcoord.y);
}
