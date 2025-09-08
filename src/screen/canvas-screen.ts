import { Screen } from './screen';

const WIDTH = 256;
const HEIGHT = 240;

export class CanvasScreen implements Screen {
  private width: number;

  private height: number;

  private ctx: CanvasRenderingContext2D;

  private hCanvas: HTMLCanvasElement;

  private hctx: CanvasRenderingContext2D;

  private hImageData: ImageData;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'medium';

    this.hCanvas = document.createElement('canvas') as HTMLCanvasElement;
    this.hCanvas.width = WIDTH;
    this.hCanvas.height = HEIGHT;
    this.hctx = this.hCanvas.getContext('2d', { alpha: false })!;
    this.hImageData = this.hctx.createImageData(WIDTH, HEIGHT);

    for (let i = 3; i < this.hImageData.data.length; i += 4) {
      this.hImageData.data[i] = 0xff;
    }
  }

  setPixel(x: number, y: number, color: number): void {
    const i = (y * WIDTH + x) * 4;
    this.hImageData.data[i] = (color & 0xff0000) >> 16;
    this.hImageData.data[i + 1] = (color & 0x00ff00) >> 8;
    this.hImageData.data[i + 2] = color & 0x0000ff;
  }

  update(): void {
    this.hctx.putImageData(this.hImageData, 0, 0);
    this.ctx.drawImage(this.hCanvas, 0, 0, this.width, this.height);
  }
}
