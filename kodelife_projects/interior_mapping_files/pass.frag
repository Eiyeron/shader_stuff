#version 150

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec3 spectrum;

uniform sampler2D texture0;
uniform sampler2D texture1;

uniform mat4 mvp;
uniform mat4 view;
uniform mat4 model;
uniform mat3 normal;

uniform vec3 roomSize;

uniform float INTERIOR_BACK_PLANE_SCALE;

float dither4x4(vec2 position, float brightness) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.0625;
    if (index == 1) limit = 0.5625;
    if (index == 2) limit = 0.1875;
    if (index == 3) limit = 0.6875;
    if (index == 4) limit = 0.8125;
    if (index == 5) limit = 0.3125;
    if (index == 6) limit = 0.9375;
    if (index == 7) limit = 0.4375;
    if (index == 8) limit = 0.25;
    if (index == 9) limit = 0.75;
    if (index == 10) limit = 0.125;
    if (index == 11) limit = 0.625;
    if (index == 12) limit = 1.0;
    if (index == 13) limit = 0.5;
    if (index == 14) limit = 0.875;
    if (index == 15) limit = 0.375;
  }

  return brightness < limit ? 0.0 : 1.0;
}


in VertexData
{
    vec4 v_position;
    vec3 v_normal;
    vec2 v_texcoord;
    vec3 v_viewDir;
} inData;

out vec4 fragColor;

// Taken from https://community.khronos.org/t/extracting-camera-position-from-a-modelview-matrix/68031
// Kodelife doesn't provide an easy access to the camera position.
// I guess I could hardcode it as "moving" the sene just edits the model matrix instead.
vec3 ExtractCameraPos3(in mat4 a_modelView)
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
  // (uisng math from RealTime Collision Detection by Christer Ericson)
  vec3 n2n3 = cross(n2, n3);
  float denom = dot(n1, n2n3);

  vec3 d = vec3(d1,d2,d3);
  vec3 v = cross(n1, d);
  
  vec3 top;
  top.x = dot(d, n2n3);
  top.y = dot(n3, v);
  top.z = -dot(n2, v);

  return top / -denom;
}

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
    

// Note : the original math implementation comes from https://andrewgotow.com/2018/09/09/interior-mapping-part-2/
// but it has an issue with room depth, I resorted using this code : https://halisavakis.com/my-take-on-shaders-interior-mapping/
// after miserably failing to build over some box/raycast code
//
// This project file hasn't been updated to apply my changes yet.
void main(void)
{

    vec3 eye = ExtractCameraPos3(view);
    //vec3 viewDir = normalize(inData.v_viewDir);
    vec3 viewDir = normalize(inData.v_position.xyz - eye);

    // In Tangent space, the vertexPosition is just the (unscaled) UV
    vec3 tangentPos = vec3(inData.v_texcoord, -1);

    mat3 tbn = cotangent_frame((inData.v_normal), inData.v_position.xyz, inData.v_texcoord);
    vec3 tanViewDir = viewDir * tbn;


    // Ray from the face, apply scaling/frac()-ing on both variables for multiple windows
    vec3 rayOrigin = fract(tangentPos / roomSize);
    vec3 rayDirection = tanViewDir / roomSize;


    // Room bound definition
    vec3 boundMin = floor(tangentPos);
    vec3 boundMax = boundMin + 1;
    vec3 boundMid = boundMin + 0.5;
    
    // [WARN] Black magic
    // Since the bounding box is axis-aligned, we can just find
    // the ray-plane intersections for each plane. we only 
    // actually need to solve for the 3 "back" planes, since the 
    // near walls of the virtual cube are "open".
    // just find the corner opposite the camera using the sign of
    // the ray's direction.
    vec3 planes = mix(boundMin, boundMax, step(0, rayDirection));
    vec3 tangentPlane = (planes - rayOrigin) / rayDirection; // naming?
   
    // Now, we know the distance to the intersection is simply
    // equal to the closest ray-plane intersection point.
    float tangentMinDistance = min(min(tangentPlane.x, tangentPlane.y), tangentPlane.z);

    vec3 roomVector = (rayOrigin + rayDirection * tangentMinDistance) - boundMid;
    vec2 interiorUV = roomVector.xy * mix(INTERIOR_BACK_PLANE_SCALE, 1, roomVector.z + 0.5) + 0.5;


    vec4 interior = texture(texture0, interiorUV);
    float darken = min(1, length(roomVector.z+0.5*2)/2);

    vec3 a = abs(normalize(roomVector));

    float factor = sin(time*2) * 0.5    ;
    factor = spectrum.y-0.5;

    if (a.z > a.x && a.z > a.y)
    {
        darken = dither4x4(roomVector.xy*64 , roomVector.z+0.8 + factor)+0.5;
    }
    else if (a.x > a.z && a.x > a.y)
    {
        darken = dither4x4(roomVector.zy*64, roomVector.z+0.8 + factor)+0.5;
    }
    else  if (a.y > a.x && a.y > a.z)
    {
        darken = dither4x4(roomVector.xz*64, roomVector.z+0.8 + factor)+0.5;
    }
    //darken = floor(darken*16)/16;
    interior *= darken;
    vec4 facade = texture(texture1, rayOrigin.xy);
    fragColor = mix(interior, facade, facade.a);
}