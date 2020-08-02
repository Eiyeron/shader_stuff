#version 150

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec3 spectrum;
uniform mat4 mvp;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 view;
uniform mat4 model;
uniform mat3 normal;


out VertexData
{
    vec4 v_position;
    vec3 v_normal;
    vec2 v_texcoord;
    vec3 v_viewDir;
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
    //mat4 rot = mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);
    mat4 rot = rotationMatrix(vec3(0,1,0), time/2+ 0*sin(time/2)*(PI*0.05));
    rot = rot * rotationMatrix(vec3(0,0,1), cos(time/2)*(PI*0.05));
    // Some drivers don't like position being written here
    // with the tessellation stages enabled also.
    // Comment next line when Tess.Eval shader is enabled.


    vec3 eye = view[2].xyz;

    // Some drivers don't like position being written here
    // with the tessellation stages enabled also.
    // Comment next line when Tess.Eval shader is enabled.
    vec4 pos = a_position;
    gl_Position =  mvp * rot * (pos);

    
    outData.v_position = model * rot * pos;
    outData.v_normal = normal * mat3(rot) * a_normal;
    outData.v_viewDir = normalize(outData.v_position.xyz - eye);
    //outData.v_texcoord = vec2(1-a_texcoord.y, 1-a_texcoord.x);
    //outData.v_texcoord = vec2(a_texcoord.x, 1-a_texcoord.y);
    outData.v_texcoord = mod(a_texcoord, vec2(2));
}
