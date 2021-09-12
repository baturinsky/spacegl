import * as g0 from "./g0/gl"
import { gl } from "./g0/gl";
import * as gc from "./g0/glconst";
import * as v3 from "./g0/v3"
import shaders from "./shaders"
import * as m4 from "./g0/m4"
import { Elements, invert } from "./g0/shape";
import { PI, rangef, RNG, X, Y, Z } from "./g0/misc";
import { Vec3 } from "./g0/v3";
import * as game from "./game"
import { dist, Vec2, mulEach, vec3 } from "./g0/v";
import { cityDepth } from "./generator";

type Notification = { text: string, at: Vec2, importance:number };

let
  pMain: WebGLProgram, pScreen: WebGLProgram,
  pMainUniform: g0.Uniforms, pScreenUniform: g0.Uniforms,
  textures: g0.Texture[], framebuffer: WebGLFramebuffer,
  viewSize: Vec2, cx2d: CanvasRenderingContext2D,
  notifications: Notification[] = [],
  smoothScore = 0;

export let O: HTMLDivElement;

export function notify(text: string, importance = 1) {
  notifications.push({ text, at: [viewSize[X] * (Math.random() * 0.2 + 0.4), viewSize[Y] / 2], importance });
}

export function init(size: Vec2) {
  let C = document.getElementById("C") as HTMLCanvasElement;
  let D = document.getElementById("D") as HTMLCanvasElement;
  O = document.getElementById("O") as HTMLDivElement;

  viewSize = size;

  C.width = D.width = viewSize[X];
  C.height = D.height = viewSize[Y];
  //C.style.maxHeight = D.style.maxHeight = `0`;
  //C.style.overflow = D.style.overflow = "visible";
  O.style.marginTop = D.style.marginTop = `${-viewSize[Y]}px`;

  C.style.width = D.style.width = O.style.width = `${viewSize[X]}px`;
  C.style.height = D.style.height = O.style.height = `${viewSize[Y]}px`;

  g0.context(C);

  cx2d = D.getContext("2d");
  cx2d.fillStyle = "#fff";

  pMain = g0.compile(shaders.vMain, shaders.fMain);
  pMainUniform = g0.uniforms(pMain);

  pScreen = g0.compile(shaders.vScreenQuad, shaders.fScreen);
  pScreenUniform = g0.uniforms(pScreen);

  textures = g0.textures([g0.TEX_RGBA, g0.TEX_RGBA, g0.TEX_DEPTHS], viewSize)

  framebuffer = g0.framebuffer(textures);

  return [C, O] as [HTMLCanvasElement, HTMLDivElement]
}

const crashPoints: Vec3[] = [[-.8, 1, -1], [.8, 1, -1], [0, 1, -1]];

let rng = RNG(1);

function write(text: string, x: number, y: number) {
  cx2d.fillText(text, x, y);
  cx2d.strokeText(text, x, y);
}

export function frame(gs: game.GameState,
  [bufs, elements]: [g0.ShapeBuffers, Elements],
  [bufsF, elementsF]: [g0.ShapeBuffers, Elements], dTime: number) {
  //I.innerHTML = `LMB click to speed up, RMB to speed down. consuming ${gs.consumingStage} | ${gs.at.map(v => ~~v)} | ${crashPixel[0]};${crashPixel[1]};${crashPixel[2]}`;

  cx2d.clearRect(0, 0, viewSize[X], viewSize[Y]);

  if (gs.combo) {
    cx2d.textAlign = "center";
    cx2d.font = "bold 32pt sans-serif";
    write(`x${game.comboMultiplier().toFixed(1)}`, viewSize[X] - 85, 100);

    smoothScore = Math.min(gs.score, smoothScore + Math.max((gs.score - smoothScore) / 10, dTime * 10))
    write(`${smoothScore.toFixed()}`, viewSize[X] / 2, 40);

    cx2d.textAlign = "right";

    cx2d.font = "bold 16pt Courier";
    write(`speed`, viewSize[X] - 10, 200);
    write(`clean city`, viewSize[X] - 10, 250);

    cx2d.font = "bold 20pt Courier";
    write(`x${game.speedMultiplier().toFixed(1)}`, viewSize[X] - 10, 220);
    write(`x${game.cleanCityMultiplier().toFixed(1)}`, viewSize[X] - 10, 270);
  }

  cx2d.font = "bold 32pt Courier";
  for (let n of notifications) {
    write(n.text, n.at[X], n.at[Y]);
    n.at[Y] -= dTime * 300 / (n.importance || 1);
  }

  //I.innerHTML = `cs ${gs.consuming} ${gs.consumingStage} ${game.relativeTimeout()} combo ${gs.combo} debris left ${gs.debrisLeft} speed bonus ${game.speedMultiplier()} timeout ${gs.timeout} timeout speed ${gs.timeoutSpeed} `;

  let time = gs.time;
  let [camera, perspective, look] = m4.viewMatrices(
    v3.sum(v3.sum(gs.at, v3.scale(gs.dir, -5)), [0, 0, 0]),
    gs.dir,
    viewSize,
    PI / 4,
    [4, cityDepth + dist(gs.at, [0, cityDepth * 0.5, 0])]
    //[4, 5000]
  );


  let invCamera = m4.inverse(camera);

  let flyer = m4.lookTo(gs.at, gs.dir, [0, 0, 1]);
  flyer = m4.multiply(flyer, m4.axisRotation([0, 0, 1], -(gs.smoothDrot[X]) * Math.PI / 4 / 100));
  flyer = m4.multiply(flyer, m4.axisRotation([1, 0, 0], -(gs.smoothDrot[Y]) * Math.PI / 4 / 200));

  let screenCrashPoints = crashPoints.map(p => {
    let a = m4.transform(camera, m4.transform(flyer, p));
    a[X] = ~~((a[X] * 0.5 + 0.5) * viewSize[X]);
    a[Y] = ~~((0.5 - a[Y] * 0.5) * viewSize[Y]);
    a[Z] = 0;
    return a;
  });

  //I.innerHTML = screenCrashPoints.flat().map(v => v.toFixed(5));

  let startTime = Date.now();

  gl.useProgram(pMain);

  g0.setUniforms(pMainUniform, {
    camera, flyer, sun: [0, cityDepth, 0], time,
    "liveDebris[0]": gs.liveDebris,
    consuming: gs.consuming,
    consumingStage: gs.consumingStage
  })

  gl.bindFramebuffer(gc.FRAMEBUFFER, framebuffer);
  gl.clear(gc.DEPTH_BUFFER_BIT | gc.COLOR_BUFFER_BIT);
  gl.drawBuffers([
    gc.COLOR_ATTACHMENT0,
    gc.COLOR_ATTACHMENT1
  ]);

  g0.setUniforms(pMainUniform, { pass: 0 });

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.faces);
  g0.setAttrDatabuffers(bufs, pMain);
  gl.drawElements(gc.TRIANGLES, elements.faces.length, gc.UNSIGNED_INT, 0);

  checkCrash(screenCrashPoints);

  g0.setUniforms(pMainUniform, { pass: 1 });

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufsF.faces);
  g0.setAttrDatabuffers(bufsF, pMain);
  gl.drawElements(gc.TRIANGLES, elementsF.faces.length, gc.UNSIGNED_INT, 0);

  gl.useProgram(pScreen);
  g0.setUniforms(pScreenUniform, {
    invCamera, flyer, time, invPerspective: m4.inverse(perspective),
    timeout: game.relativeTimeout(),
    viewSize: [viewSize[X], viewSize[Y], 0],
    scp0: screenCrashPoints[0], scp1: screenCrashPoints[1], scp2: screenCrashPoints[2]
  })

  g0.bindTextures(textures, [pScreenUniform.T0, pScreenUniform.T1, pScreenUniform.Depth]);
  gl.bindFramebuffer(gc.FRAMEBUFFER, null);
  gl.drawArrays(gc.TRIANGLES, 0, 6);

  gl.flush();

  //console.log(`Rendered in ${Date.now() - startTime} ms`);
}

export let crashPixel = rangef(4, _ => new Uint8Array(4));

async function checkCrash(screenCrashPoints: Vec3[]) {
  //gl.readPixels(1, 1, 1, 1, gc.RGBA, gc.UNSIGNED_BYTE, pixels);
  //await g0.readPixelsAsync(1, 1, 1, 1, gc.RGBA, gc.UNSIGNED_BYTE, crashPixel);
  gl.readBuffer(gc.COLOR_ATTACHMENT1);
  await Promise.all(rangef(3, n =>
    g0.readPixelsAsync(screenCrashPoints[n][X], screenCrashPoints[n][Y], 1, 1, gc.RGBA, gc.UNSIGNED_BYTE, crashPixel[n])
  ));
}

export function renderUI(gs: game.GameState) {
  if (!gs) {
    O.style.visibility = "hidden";
    return;
  }

  O.style.visibility = "visible";

  let saves = [];
  for (let slot = 0; slot < 10; slot++) {
    let save = localStorage["warpStation13K-" + slot];
    if (!save && slot > 0)
      break;
    let parsed = save ? JSON.parse(save) : {};
    saves.push(`${parsed.score || "0"}pts ${parsed.date || ""}`)
  }
  if(saves.length<10)
    saves.push('New Save')

  O.innerHTML = `
  <H1>Warp Station 13K</H1>
  <p>Score: ${gs.score}/${game.scoreForNextLevel()} Level: ${gs.level} Upgrade points: ${gs.points}</p>
  <H3>Upgrades</H3>
    ${game.UpgradeNames.map((v, i) =>
    `
      <span class="u">${v}</span>
      <button id="down_${i}">-</button>
      <span class="up">${gs.upgrades[i]}</span>
      <button id="up_${i}">+</button><br/>`
  ).join("")}
  <H3>Saves</H3>
  <button id="new">New Game</button><br/><br/>
  ${saves.map((v, i) => `
  <div>    
    <button style="visibility:${i != 0?'':'hidden'}" id="save_${i}">Save</button>
    <span class="si">${i ? i : "Auto"}</span>
    <span class="st">${v}</span>    
    <button style="visibility:${v != "New Save"?'':'hidden'}" id="load_${i}" class="lb">Load</button>
    </div>
  `).join("")}`
}