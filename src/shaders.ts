//@ts-nocheck
import gradient from "./shaders/gradient.glsl"
import vAsIs from "./shaders/vAsIs.glsl"
import fMain from "./shaders/fMain.glsl"
import fScreen from "./shaders/fScreen.glsl"
import vScreenQuad from "./shaders/vScreenQuad.glsl"
import vCamera from "./shaders/vCamera.glsl"

const shaders = {fMain, vCamera, fScreen, vScreenQuad};

export default shaders;
