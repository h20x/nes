import {
  Button,
  CanvasScreen,
  Console,
  Controller,
  createMapper,
} from '../console';
import './app.css';

const KEYS = new Map([
  ['KeyZ', Button.A],
  ['KeyX', Button.B],
  ['Tab', Button.Select],
  ['Enter', Button.Start],
  ['ArrowUp', Button.Up],
  ['ArrowDown', Button.Down],
  ['ArrowLeft', Button.Left],
  ['ArrowRight', Button.Right],
]);

let nes: Console;
let gameData: ArrayBuffer;
const controller1 = new Controller();
const controller2 = new Controller();
const fileInput = document.querySelector('.file')!;
const btnReset = document.querySelector('.btn-reset')!;
const canvas = document.querySelector('.screen') as HTMLCanvasElement;

btnReset.addEventListener('click', reset);
fileInput.addEventListener('change', handleFileSelection);
document.addEventListener('keydown', handleKeyDown);
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
    nes = new Console(new CanvasScreen(canvas), controller1, controller2);
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

function notifyErr(err: string | Error) {
  console.error(err);
  alert(typeof err === 'string' ? err : err.message);
}
