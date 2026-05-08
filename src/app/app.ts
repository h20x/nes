import {
  Button,
  CanvasScreen,
  Console,
  Controller,
  createMapper,
} from '../console';
import './app.css';

declare var darkMode: boolean;

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

let nes: Console;
let gameData: ArrayBuffer;
let controlsOpen = false;
const controller1 = new Controller();
const controller2 = new Controller();
const canvasEl = document.querySelector('.screen') as HTMLCanvasElement;
const controlsEl = document.querySelector('.controls')!;

document.querySelectorAll('.file').forEach((el) => {
  el.addEventListener('change', handleFileSelection);
});
document.querySelector('.ctrl-reset')!.addEventListener('click', reset);
document.querySelector('.ctrl-keys')!.addEventListener('click', openControls);
document.querySelector('.ctrl-mode')!.addEventListener('click', switchMode);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keydown', (e) => {
  e.code === 'KeyR' && reset();
});
document.addEventListener('keyup', handleKeyUp);

function handleFileSelection(e: Event) {
  const file = (e.target as HTMLInputElement).files![0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => play(reader.result as ArrayBuffer);
  reader.onerror = () => notifyErr(`Failed reading file "${file.name}"`);
  reader.readAsArrayBuffer(file);
}

function handleKeyDown(e: KeyboardEvent): void {
  if (KEYS.has(e.code)) {
    e.preventDefault();
    controller1.pressButton(KEYS.get(e.code)!);
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  if (KEYS.has(e.code)) {
    e.preventDefault();
    controller1.releaseButton(KEYS.get(e.code)!);
  }
}

function play(data: ArrayBuffer) {
  if (!data) {
    return;
  }

  if (!nes) {
    nes = new Console(new CanvasScreen(canvasEl), controller1, controller2);
    hideIntro();
  }

  try {
    nes.play(createMapper(data));
    gameData = data;
  } catch (err) {
    notifyErr(err as Error);
  }
}

function reset() {
  play(gameData);
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
