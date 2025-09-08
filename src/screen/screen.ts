export interface Screen {
  setPixel(x: number, y: number, color: number): void;
  update(): void;
}
