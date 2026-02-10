import { CanvasScreen, Console, createMapper } from '../console';
import './app.css';

let nes: Console;
let gameData: ArrayBuffer;

const fileInput = document.querySelector('.file')!;
const btnReset = document.querySelector('.btn-reset')!;
const screen = document.querySelector('.screen') as HTMLCanvasElement;

fileInput.addEventListener('change', handleFileSelection);
btnReset.addEventListener('click', play);

function handleFileSelection(e: Event) {
  const file = (e.target as HTMLInputElement).files![0];
  const reader = new FileReader();

  reader.onload = () => {
    gameData = reader.result as ArrayBuffer;
    play();
  };

  reader.onerror = () => {
    notifyErr(`Failed reading file "${file.name}"`);
  };

  reader.readAsArrayBuffer(file);
}

function play() {
  if (!gameData) {
    return;
  }

  if (!nes) {
    nes = new Console(new CanvasScreen(screen));
  }

  try {
    nes.play(createMapper(gameData));
  } catch (err) {
    notifyErr(err as Error);
  }
}

function notifyErr(err: string | Error) {
  console.error(err);
  alert(typeof err === 'string' ? err : err.message);
}
