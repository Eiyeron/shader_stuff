#version 150

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec3 spectrum;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;
uniform sampler2D prevFrame;
uniform sampler2D prevPass;

in VertexData
{
    vec4 v_position;
    vec3 v_normal;
    vec2 v_texcoord;
} inData;

out vec4 fragColor;

const float a = 10;
const float b = 11;
const float c = 12;
const float d = 13;
const float e = 14;
const float f = 15;

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

// Classic bayer pattern
#if 0
mat4 bayer = mat4(
    0,8,2,a,
    c,4,e,6,
    3,b,1,9,
    f,7,d,5
);
#endif

// Horizontal lines
#if 0
mat4 bayer = mat4(
    f,f,f,f,
    0,0,0,0,
    f,f,f,f,
    0,0,0,0
);
#endif

// Fancier Horizontal lines
#if 0
mat4 bayer = mat4(
    f,f,f,f,
    4,4,4,4,
    b,b,b,b,
    0,0,0,0
);
#endif


// Diagonals
#if 0
mat4 bayer = mat4(
    f,b,4,0,
    0,f,b,4,
    4,0,f,b,
    b,4,0,f
);
#endif

// Alternating Diagonals
#if 0
mat4 bayer = mat4(
    f,4,b,0,
    0,f,4,b,
    b,0,f,4,
    4,b,0,f
);
#endif

// Fancier Diagonals
#if 0
mat4 bayer = mat4(
    f-1,b-2,4+3,0+4,
    0+2,f-3,b-4,4+1,
    4+3,0+4,f-1,b-2,
    b-4,4+1,0+2,f-3
);
#endif

// Zig-zag
#if 0
mat4 bayer = mat4(
    4,0,f,b,
    0,f,b,4,
    f,b,4,0,
    0,f,b,4
);
#endif
// Zig-zag with small cut line
#if 0
mat4 bayer = mat4(
    3,0,e,a,
    0,f,b,4,
    f,b,4,0,
    0,f,b,4
);
#endif


// Vichy pattern
#if 0
mat4 bayer = mat4(
    f,f,0,f,
    f,f,f,0,
    0,f,0,0,
    f,0,0,0
);
#endif

// Some Vichy pattern
// Keeping this one as it looks good
#if 0
mat4 bayer = mat4(
    f,f,4,b,
    f,f,b,4,
    0,f,0,0,
    f,0,0,0
);
#endif

#if 0
mat4 bayer = mat4(
    f,f,4,b,
    f,f,b,4,
    4,b,0,0,
    b,4,0,0
);
#endif


// Some zig-zag tests
// +/- 0-1
#if 0
mat4 bayer = mat4(
    4,0,f,b,
    0,f,b,4,
    f-1,b-1,4+1,0+0,
    0,f,b,4
);
#endif
// +/- 0-3
#if 0
mat4 bayer = mat4(
    4,0,f,b,
    0+1,f-1,b-1,4+1,
    f-2,b-2,4+2,0+2,
    0+3,f-3,b-3,4+3
);
#endif
// +/- 0-6
#if 0
mat4 bayer = mat4(
    4,0,f,b,
    0+2,f-2,b-2,4+2,
    f-4,b-4,4+4,0+4,
    0+6,f-6,b-6,4+6
);
#endif

// Some cross test
// This one also looks pretty good
#if 1
mat4 bayer = mat4(
    0,0+2,0+4,0+6,
    f,f-2,f-4,f-6,
    0,0+2,0+4,0+6,
    f,f-2,f-4,f-6
);
#endif

// Bubbles
#if 0
mat4 bayer = mat4(
    0,f,0,0,
    f,b,f,0,
    0,f,0,0,
    0,0,0,4
);
#endif

void main(void)
{
    int by = int(gl_FragCoord.y/2)%4;
    int bx = int(gl_FragCoord.x/2)%4;

    float t = sin(time);
    vec3 light = normalize(vec3(0.2*sin(t),0.2,0.2*cos(t)));

    //float inV = inData.v_texcoord.y;
    float inV = dot(light, normalize(inData.v_normal));
    
    float dither = step(inV, (bayer[by][bx])/16.+1./32.);
    
    vec3 colorA = palette(0 + time/60., vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25));
    vec3 colorB = palette(0.5 + time/60, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25));
    vec3 color = mix(colorA, colorB, dither);
    fragColor = vec4(color, 1.);
}
