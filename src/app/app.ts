import { Screen, ScreenGL } from '../console';
import './app.css';

declare var darkMode: boolean;

enum Button {
  A = 1 << 0,
  B = 1 << 1,
  Select = 1 << 2,
  Start = 1 << 3,
  Up = 1 << 4,
  Down = 1 << 5,
  Left = 1 << 6,
  Right = 1 << 7,
}

const KEYS = new Map([
  ['KeyZ', Button.A],
  ['KeyX', Button.B],
  ['Space', Button.Select],
  ['Enter', Button.Start],
  ['ArrowUp', Button.Up],
  ['ArrowDown', Button.Down],
  ['ArrowLeft', Button.Left],
  ['ArrowRight', Button.Right],
]);

const controlsEl = document.querySelector('.controls')!;
let gameDataPtr: number | null = null;
let controlsOpen = false;
let rafId: number = 0;
let screen: Screen;
let imageDataPtr: number;
let imageDataArr: Uint8ClampedArray;
let wmodule: WasmModule;

Module().then((instance) => {
  wmodule = instance;

  const width = 256;
  const height = 240;
  const size = width * height * 4;
  imageDataPtr = wmodule._malloc(size);
  imageDataArr = new Uint8ClampedArray(
    wmodule.HEAPU8.buffer,
    imageDataPtr,
    size
  );
  screen = new ScreenGL(
    document.querySelector('.screen') as HTMLCanvasElement,
    imageDataArr,
    width,
    height
  );
  screen.init();

  document.querySelectorAll('.file').forEach((el) => {
    el.addEventListener('change', handleFileSelection);
  });
  document.querySelector('.ctrl-reset')!.addEventListener('click', play);
  document.querySelector('.ctrl-keys')!.addEventListener('click', openControls);
  document.querySelector('.ctrl-mode')!.addEventListener('click', switchMode);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  document.querySelector('.panel')!.classList.remove('vh');
  document.querySelector('.intro .btn')!.classList.remove('vh');
});

function handleFileSelection(e: Event) {
  const file = (e.target as HTMLInputElement).files![0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    wmodule._free(gameDataPtr);
    const view = new Uint8Array(reader.result as ArrayBuffer);
    gameDataPtr = wmodule._malloc(view.byteLength);
    wmodule.HEAPU8.set(view, gameDataPtr);
    play();
  };
  reader.onerror = () => notifyErr(`Error: failed to read file "${file.name}"`);
  reader.readAsArrayBuffer(file);
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.code === 'KeyR') {
    play();
  } else if (e.code === 'KeyO') {
    (document.querySelector('.file') as HTMLInputElement).click();
  } else if (KEYS.has(e.code)) {
    e.preventDefault();
    wmodule._pressButton(KEYS.get(e.code)!);
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  if (KEYS.has(e.code)) {
    e.preventDefault();
    wmodule._releaseButton(KEYS.get(e.code)!);
  }
}

function play() {
  if (gameDataPtr == null) {
    return;
  }

  wmodule._init(gameDataPtr, imageDataPtr);
  startGameLoop();
  hideIntro();
}

function switchMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', JSON.stringify(darkMode));
  document.documentElement.classList.toggle('dark', darkMode);
}

function hideIntro() {
  document.querySelector('.intro')!.classList.add('hidden');
}

function openControls() {
  if (controlsOpen) {
    return;
  }

  const close = () => {
    controlsOpen = false;
    controlsEl.classList.add('hidden');
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('click', onClick);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code == 'Escape') {
      close();
    }
  };

  const onClick = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.controls-inner')) {
      close();
    }
  };

  controlsOpen = true;
  controlsEl.classList.remove('hidden');

  setTimeout(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
  }, 0);
}

function notifyErr(err: string | Error) {
  console.error(err);
  alert(typeof err === 'string' ? err : err.message);
}

function startGameLoop(): void {
  cancelAnimationFrame(rafId);

  const frameTime = 1000 / 60;
  let time = 0;
  let prev = 0;

  const frame = (now: number) => {
    time += now - prev;
    const skip = time < frameTime;
    prev = now;
    time %= frameTime;

    if (!skip) {
      wmodule._renderFrame();
      screen.update();
    }

    rafId = requestAnimationFrame(frame);
  };

  frame(0);
}
