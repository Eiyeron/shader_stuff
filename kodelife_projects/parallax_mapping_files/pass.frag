#version 150

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec3 spectrum;

uniform mat4 view;

uniform sampler2D lower;
uniform sampler2D upper;
uniform sampler2D prevFrame;
uniform sampler2D prevPass;


uniform float parallax_layer_factor;
uniform float parallax_offset;
uniform float parallax_num_layers;
uniform float parallax_fog_factor;

// The heightmap modulates the offset the parallax starts at.
// Play with it, it's really fun to have glitchy results with it.
//#define USE_HEIGHTMAP
#ifdef USE_HEIGHTMAP
uniform sampler2D heightMap;
#endif

// Taken from https://community.khronos.org/t/extracting-camera-position-from-a-modelview-matrix/68031
// Kodelife doesn't provide an easy access to the camera position.
// I guess I could hardcode it as "moving" the sene just edits the model matrix instead.
vec3 ExtractCameraPos(in mat4 a_modelView)
{
  // Get the 3 basis vector planes at the camera origin and transform them into model space.
  //  
  // NOTE: Planes have to be transformed by the inverse transpose of a matrix
  //       Nice reference here: http://www.opengl.org/discussion_boards/showthread.php/159564-Clever-way-to-transform-plane-by-matrix
  //
  //       So for a transform to model space we need to do:
  //            inverse(transpose(inverse(MV)))
  //       This equals : transpose(MV) - see Lemma 5 in http://mathrefresher.blogspot.com.au/2007/06/transpose-of-matrix.html
  //
  // As each plane is simply (1,0,0,0), (0,1,0,0), (0,0,1,0) we can pull the data directly from the transpose matrix.
  //  
  mat4 modelViewT = transpose(a_modelView);
  
  // Get plane normals 
  vec3 n1 = vec3(modelViewT[0]);
  vec3 n2 = vec3(modelViewT[1]);
  vec3 n3 = vec3(modelViewT[2]);

  // Get plane distances
  float d1 = (modelViewT[0].w);
  float d2 = (modelViewT[1].w);
  float d3 = (modelViewT[2].w);

  // Get the intersection of these 3 planes
  // http://paulbourke.net/geometry/3planes/
  vec3 n2n3 = cross(n2, n3);
  vec3 n3n1 = cross(n3, n1);
  vec3 n1n2 = cross(n1, n2);

  vec3 top = (n2n3 * d1) + (n3n1 * d2) + (n1n2 * d3);
  float denom = dot(n1, n2n3);

  return top / -denom;
}


in VertexData
{
    vec4 v_position;
    vec3 v_normal;
    vec2 v_texcoord;
} inData;

out vec4 fragColor;

// Instead of having tangent/bitangent, let's use this
// Source : http://www.thetenthplanet.de/archives/1180
mat3 cotangent_frame( vec3 N, vec3 p, vec2 uv )
{
    // get edge vec­tors of the pixel triangle
    vec3 dp1 = dFdx( p );
    vec3 dp2 = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );

    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // con­struct a scaleinvariant frame 
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    return mat3( T * invmax, B * invmax, N );
}

void main(void)
{
    vec3 eye = view[2].xyz;
    vec3 faceNormal = normalize(inData.v_normal);
    
    vec3 viewDir = (inData.v_position.xyz - eye);
    
    mat3 tbn = cotangent_frame(faceNormal, inData.v_position.xyz, inData.v_texcoord);
    
    vec3 tangentViewDir = normalize(viewDir * tbn);

    vec4 color = vec4(0,0,0,1);
    for (int i = int(parallax_num_layers); i >= 0; --i)
    {
        float layerParallax = float(i) * parallax_layer_factor + parallax_offset;
        
#ifdef USE_HEIGHTMAP
        layerParallax += texture(heightMap, inData.v_texcoord).r*2;
#endif
        float layerFog = parallax_fog_factor * (parallax_num_layers - i)/parallax_num_layers;
        layerFog = pow(layerFog,2);

        vec4 lower_frag = texture(lower, inData.v_texcoord*8+0.5 + tangentViewDir.xy * layerParallax);
        
        color.rgb = mix(color, lower_frag * layerFog, lower_frag.a).rgb;
    }
    
    vec4 upper_frag = texture(upper, inData.v_texcoord);

    color = mix(color, upper_frag, upper_frag.a);


    fragColor = color;
}
