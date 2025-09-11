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

  private dataView: DataView;

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
    this.dataView = new DataView(this.hImageData.data.buffer);
  }

  setPixel(x: number, y: number, color: number): void {
    this.dataView.setUint32((y * WIDTH + x) * 4, (color << 8) | 0xff);
  }

  update(): void {
    this.hctx.putImageData(this.hImageData, 0, 0);
    this.ctx.drawImage(this.hCanvas, 0, 0, this.width, this.height);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
