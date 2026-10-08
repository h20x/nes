import { Screen } from './screen';

export class CanvasScreen implements Screen {
  private ctx: CanvasRenderingContext2D;

  private imgData: ImageData;

  constructor(
    canvas: HTMLCanvasElement,
    private pixels: Uint8ClampedArray,
    private width: number = 256,
    private height: number = 240
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.imgData = this.ctx.createImageData(width, height);
  }

  setPixel(x: number, y: number, color: number): void {}

  update(): void {
    this.imgData.data.set(this.pixels);
    this.ctx.putImageData(this.imgData, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
