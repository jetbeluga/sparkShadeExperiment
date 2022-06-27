/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import { findFirst } from "Materials";
import { cos, scalarSignalSource } from "Reactive";

//==============================================================================
// Welcome to scripting in Spark AR Studio! Helpful links:
//
// Scripting Basics - https://fb.me/spark-scripting-basics
// Reactive Programming - https://fb.me/spark-reactive-programming
// Scripting Object Reference - https://fb.me/spark-scripting-reference
// Changelogs - https://fb.me/spark-changelog
//
// Spark AR Studio extension for VS Code - https://fb.me/spark-vscode-plugin
//
// For projects created with v87 onwards, JavaScript is always executed in strict mode.
//==============================================================================

// How to load in modules
//GLSL - openGL shading language - language spark uses for the shader modules
// once data is send to the GPU there is no way to access the data again in spark you can only see the rendered result in an adequate app.
// I Asume that this means it's impossible to take the result of one shader and use it as an input for another module like in eevee (blender) - convert shader to rgb for example
// That's possibly also the reason why i cannot log the result of shader functions => yes!
// Spark has 2 types of shaders:
// vertex shader - operation on vertices & transforming them to "pixelspace"
// pixel shader - generating color output
// spark processing order - CPU(running once per frame) => vertex shader(running once per vertex) => pixel shader/fragment shader(running once per pixel)

const Scene = require("Scene");

// Use export keyword to make a symbol available in scripting debug console
export const Diagnostics = require("Diagnostics");
const M = require("Materials");
const S = require("Shaders");
const R = require("Reactive");
const T = require("Textures");
const Time = require("Time");
// To use variables and functions across files, use export/import keyword
// export const animationDuration = 10;

(async function () {
  const [defaultMat, cameraTex] = await Promise.all([
    M.findFirst("material0"),
    T.findFirst("cameraTexture0"),
  ]);

  // cpu code
  const seconds = R.mul(Time.ms, 0.001);
  const left_curve = R.abs(R.sin(seconds), 0.01);
  const right_curve = R.abs(R.cos(seconds), 0.01);

  const uv_curve = R.mul(R.sin(seconds), 0.01);

  const uvs = S.vertexAttribute({
    variableName: S.VertexAttribute.TEX_COORDS,
  }); // running on vertex shader
  //interpolators => take output of vertex shader and interpolate it on triangle to send it to pixel shader
  // UVs from vertex shader =>  UVS from pixel shader
  const color = S.textureSampler(cameraTex.signal, uvs); // fragment shader

  const left_col = R.add(color, R.pack4(left_curve, 0, 0.2, 1));
  const right_col = R.add(color, R.pack4(0.2, 0, right_curve, 1));
  // const left_col = R.add(color, R.mul(R.pack4(0.7, 0.3, 0.2, 1), left_curve));
  // const right_col = R.add(color, R.mul(R.pack4(0.3, 0.4, 0.8, 1), right_curve));

  const fragmentUvs = S.fragmentStage(uvs); // returns uv's from fragment shader
  const animUvs = R.add(fragmentUvs, uv_curve);

  const split = R.step(fragmentUvs.x, 0.5);
  const smooth_split = R.smoothStep(animUvs.x, 0.3, 0.6);

  //mix shader
  // a,b,t [0,1]
  //a*(1-t) +b*t
  // 0 => a * 1 + b * 0
  // result = a
  // 1 => a * 0  + b * 1
  // result = b
  // 0.5 => a * 0.5 + b * 0.5
  // ab
  const blend_color = R.mix(left_col, right_col, smooth_split);

  const uvColor = R.pack4(0, 0, smooth_split, 1);
  const finalColor = blend_color;
  const textureSlot = S.DefaultMaterialTextures.DIFFUSE;
  defaultMat.setTextureSlot(textureSlot, finalColor); // fragment shader => output

  // Enables async/await in JS [part 1]
  // To access scene objects
  // const [directionalLight] = await Promise.all([
  //   Scene.root.findFirst('directionalLight0')
  // ]);
  // To access class properties
  // const directionalLightIntensity = directionalLight.intensity;
  // To log messages to the console
  // Diagnostics.log('Console message logged from the script.');
})(); // Enables async/await in JS [part 2]
