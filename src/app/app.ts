import { CanvasScreen, Console, createMapper } from '../console';
import './app.css';

let nes: Console;

const fileInput = document.querySelector('.file')!;
const btnReset = document.querySelector('.btn-reset')!;
const screen = document.querySelector('.screen') as HTMLCanvasElement;

fileInput.addEventListener('change', handleFileSelection);
btnReset.addEventListener('click', () => nes?.reset());

function handleFileSelection(e: Event) {
  const file = (e.target as HTMLInputElement).files![0];
  const reader = new FileReader();

  const notifyErr = (msg: string) => {
    console.log(msg);
    alert(msg);
  };

  reader.onload = () => {
    if (!nes) {
      nes = new Console(new CanvasScreen(screen));
    }

    try {
      nes.play(createMapper(reader.result as ArrayBuffer));
    } catch (err) {
      notifyErr((err as Error).message);
    }
  };

  reader.onerror = () => {
    notifyErr(`Failed reading file "${file.name}"`);
  };

  reader.readAsArrayBuffer(file);
}
