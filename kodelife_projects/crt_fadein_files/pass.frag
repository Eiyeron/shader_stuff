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


// A fade-in similar to a CRT turning on and warming up.
// I like the linear fade in because it "feels" more physical-based
// but I feel like it'd closer to truth if I were using an
// exponential function instead?

// I based my shader on the fact that unlike a simple linear fade
// it seems that the intensity of the ray is a factor of the final color.
// So both time and the fragment intensity are modulating the final result.

#define LINEAR_SPACE_EXPSTEP_BRIGHTNESS
//#define SRGB_SPACE_EXPSTEP_BRIGHTNESS

float linearToBrightness(vec3 linearColor)
{
    return 0.2126 * linearColor.r + 0.7152 * linearColor.g + 0.0722 * linearColor.b;
}



// Once again, thanks iq (https://iquilezles.org/www/articles/functions/functions.htm)
float expStep( float x, float k, float n )
{
    return exp( -k*pow(x,n) );
}

void main(void)
{
    float linearFadeFactor = clamp(time - 1, 0 , 2)/2;
    vec3 color = texture(texture0, inData.v_texcoord).rgb;

// Linear fades
#ifdef LINEAR_SPACE_LINEAR_FADE
    vec3 gColor = pow(color, vec3(2.2));
    gColor *= linearFadeFactor;
    color = pow(gColor, vec3(1/2.2));
#endif

#ifdef SRGB_SPACE_LINEAR_FADE
    color *= linearFadeFactor;
#endif

// Brightness-based clip. Quite close, but not smooth.
#ifdef LINEAR_SPACE_CLIP_BRIGHTNESS
    vec3 gColor = pow(color, vec3(2.2));
    float b = linearToBrightness(gColor);
    gColor *= step((1-linearFadeFactor), b) * linearFadeFactor;
    color = pow(gColor, vec3(1/2.2));
#endif

// Using expstep to interpolate instead of instantly switch between 1 and 0.
// expstep's last argument can be changed to produce more or less smooth transitions.
#ifdef LINEAR_SPACE_EXPSTEP_BRIGHTNESS
    vec3 gColor = pow(color, vec3(2.2));
    float b = linearToBrightness(gColor);
    gColor *= expStep( 1 - b + (1-linearFadeFactor), 1, 8) * linearFadeFactor;
    color = pow(gColor, vec3(1/2.2));
#endif

#ifdef SRGB_SPACE_EXPSTEP_BRIGHTNESS
    vec3 gColor = pow(color, vec3(2.2));
    float b = linearToBrightness(gColor);
    color *= expStep( 1 - b + (1-linearFadeFactor), 1, 8) * linearFadeFactor;;
#endif


    fragColor = vec4(color, 1);
}
