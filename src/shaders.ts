//@ts-nocheck
import gradient from "./shaders/gradient.glsl"
import fmain from "./shaders/fmain.glsl"
import fscreen from "./shaders/fscreen.glsl"
import vscreenQuad from "./shaders/vscreenQuad.glsl"
import vasIs from "./shaders/vasIs.glsl"
import vCamera from "./shaders/vCamera.glsl"

const shaders = {fmain, gradient, fscreen, vscreenQuad, vasIs, vCamera};

export default shaders;
