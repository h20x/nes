import { Screen } from './screen';

export class Screen2d implements Screen {
  private ctx: CanvasRenderingContext2D;

  private imgData: ImageData;

  constructor(
    canvas: HTMLCanvasElement,
    private pixels: Uint8ClampedArray,
    width: number = 256,
    height: number = 240
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.imgData = this.ctx.createImageData(width, height);
  }

  init() {}

  update(): void {
    this.imgData.data.set(this.pixels);
    this.ctx.putImageData(this.imgData, 0, 0);
  }
}
