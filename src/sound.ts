import { rangef, PI, PIH, PI2, RNG } from "./g0/misc";

let ax: AudioContext;
export let sampleRate = 44100, frequency = 440;

export function init() {
  ax = ax || new window.AudioContext()
}

export function soundBuf(samples: number[][]) {
  const buffer = ax.createBuffer(samples.length, samples[0].length, sampleRate);
  samples.forEach((d, i) => buffer.getChannelData(i).set(d));
  return buffer;
}

export function play(buffer: AudioBuffer) {
  const source = ax.createBufferSource();
  source.buffer = buffer;
  source.connect(ax.destination);
  source.start();
  return source;
}

export const sin = (t: number) => Math.sin(t);

export const beat = (t: number) => Math.sin(t * 1e9 % 1);

export const noise = (t: number) => Math.random();

export const brown = (a: number = 0.02, b: number = 0.1) => {
  let bl = 0;
  return (t: number) => {
    var white = Math.random() * 2 - 1;
    let v = (bl + (a * white)) / (1 + a);
    bl = v;
    v *= b / a;
    return v;
  }
}

export const ding = (t: number) => Math.sin(t ** 0.1 * PI)

export const woo = (t: number) => Math.sin(t * PI)

export const one = (t: number) => 1;

export const pitch = (n: number, f: (t: number) => number) => (t: number) => f(t * n);

export const soundArr = (volumeShader: (n: number) => number, waveShader: (n: number) => number, dur: number = 1) =>
  rangef(sampleRate * dur, t => waveShader(t / sampleRate * PI2) * volumeShader(t / dur / sampleRate));

export const onenote = (...args: [(n: number) => number, (n: number) => number, number?]) =>
  soundBuf([soundArr(...args)])

export const key = (n: number) => 2 ** (n / 12) * 440

let tone: AudioBuffer;
export function play1() {
  tone = tone || soundBuf(rangef(1, n => soundArr(ding, pitch(key(~~(n / 3) - (n % 3) * 12), sin))))
  //tone = tone || onenote(ding, brown());
  play(tone);
}

const withCounter = (f: Function) => {
  let counter = 0;
  return (notes: any) => f(notes, counter++);
}

export function parser(config: { [id: string]: Function }) {
  let shader: { [id: string]: Function } = {}, closer: { [id: string]: string } = {};
  for (let k in config) {
    closer[k[1]] = k[0];
    shader[k[0]] = config[k];
  }
  let stack: any[] = [[], []];
  let tree = (song: string) => {
    let curvyDepth = 0;
    [...song].forEach((char, i) => {
      if (char == "{"){
        curvyDepth++;
        stack.unshift([]);
      } else if (char == "}") {
        curvyDepth--;
        let text = stack[0].join``;
        stack[1].push({ x: withCounter((_:any,C:number) => (0,eval)(`C=${C};${text}`)) });
        stack.shift();
      } else if (curvyDepth) {
        stack[0].push(char);
      } 
      
      else if (shader[char] && stack[0][0] != closer[char]) {
        stack.unshift([char]);
      } else if (closer[char]) {
        if (stack[0][0] == closer[char]) {
          stack[1].push({ f: withCounter(shader[stack[0].shift()]), d: stack[0] });
          stack.shift();
        } else throw i
      } else {
        stack[0].push(char);
      }
    })
    return stack[0];
  }

  return tree;
}

let pass = (data: any): string[] => {
  if (data.f)
    return pass(data.f(data.d))
  else if (data.x)
    return data.x()
  else if (Array.isArray(data))
    return data.map(sym => pass(sym)).flat()
  else
    return data;
}

let rng = RNG(Math.random());

let groups: { [id: string]: any } = {
  "==": (notes: any[]) => ({ n: notes }),
  "()": (notes: any[]) => notes,
  "<>": (notes: any[], pass: number) => notes[pass % notes.length],
  "[]": (notes: any[]) => notes[rng(notes.length)],
}

export const noteToTone = (n: number) => ~~(n * 12 / 7 + 0.4);
export const toneToNote = (n: number) => ~~(n * 7 / 12 + 0.35);

export function play2() {
  let d = 200;
  let sheet = "jijgegc jijgegc lklihghe";
  sheet.split('').forEach((v, i) => {
    setTimeout(() => {
      if (v > 'a')
        node(((v.charCodeAt(0) - 97) * 12 / 7 + 0.5), 1);
    }, i * d);
  })
}

export function node(note: number, dur = 3) {
  let [o, g] = og();
  g.gain.setValueAtTime(440 / key(note), ax.currentTime);
  o.frequency.setValueAtTime(key(note), ax.currentTime);
  g.gain.exponentialRampToValueAtTime(1e-5, ax.currentTime + dur);
  o.stop(ax.currentTime + dur)
}

export function og(type: OscillatorType = "sine") {
  let o = ax.createOscillator();
  let g = ax.createGain();
  o.type = type;
  o.connect(g);
  o.start();
  g.connect(ax.destination);
  return [o, g] as [OscillatorNode, GainNode]
}

export function test(){
  let tree = parser(groups)("1<23=xy={console.log(C);C*C}(v[wu])>ab");
  //let tree = parser(groups)("[uv[vu]]aa[b{cd}]");
  //let tree = parser(groups)("abcd");
  console.log("tree", tree);
  
  for (let i = 0; i < 20; i++) {
    console.log(pass(tree));
  }  
}