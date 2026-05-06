import { Screen } from './screen';

const WIDTH = 256;
const HEIGHT = 240;

export class CanvasScreen implements Screen {
  private ctx: CanvasRenderingContext2D;

  private imageData: ImageData;

  private dataView: DataView;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.imageData = this.ctx.createImageData(WIDTH, HEIGHT);
    this.dataView = new DataView(this.imageData.data.buffer);
  }

  setPixel(x: number, y: number, color: number): void {
    this.dataView.setUint32((y * WIDTH + x) * 4, color);
  }

  update(): void {
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
  }
}
