type Handler = (keyCode: string) => void

const interval = 100
let pressed: { [key: string]: number } = {};
let subs: ((keyCode: string) => void)[] = []
let mouseDelta: Vec2 = [0, 0]

export function init(element: Element | Window | Document) {
  ["keydown", "keyup", "mousedown", "mouseup", "mousemove"].forEach(e => element.addEventListener(e, handleEvent))
  return [pressed, subs];
}

function handleEvent(e: KeyboardEvent | MouseEvent) {
  let code: string;
  let type: string;
  console.log(e);

  type = e.type;

  if (e instanceof KeyboardEvent) {
    code = e.code
  } else {
    if (e.type == "mousemove") {
    } else {
      code = "Click" + e.button
    }
  }

  if (type == "down") {
    if (!(code in pressed)) {
      click(code)
      pressed[code] = window.setInterval(() => click(code), interval)
    }
  }

  if (type == "up") {
    window.clearInterval(pressed[code])
    delete pressed[code]
  }
}

function click(code: string) {
  for (let s of subs) {
    s(code)
  }
}

export function sub(handler: Handler) {
  subs.push(handler)
}

export function unsub(handler: Handler) {
  subs = subs.filter(s => s != handler)
}

export function once(handler: Handler) {
  let f = (code: string) => {
    unsub(f)
    handler(code)
  }
  sub(f)
}

export function isPressed(keyCode: number): boolean {
  return keyCode in pressed
}

export function clear() {
  subs = []
}