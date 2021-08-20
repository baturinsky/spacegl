//@ts-nocheck
import gradient from "./shaders/gradient.glsl"
import vAsIs from "./shaders/vAsIs.glsl"
import fMain from "./shaders/fMain.glsl"
import fScreen from "./shaders/fScreen.glsl"
import vScreenQuad from "./shaders/vScreenQuad.glsl"
import vMain from "./shaders/vMain.glsl"

const shaders = {fMain, vMain, fScreen, vScreenQuad};

export default shaders;
