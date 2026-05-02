export enum Button {
  A = 1 << 0,
  B = 1 << 1,
  Select = 1 << 2,
  Start = 1 << 3,
  Up = 1 << 4,
  Down = 1 << 5,
  Left = 1 << 6,
  Right = 1 << 7,
}

export class Controller {
  private state: number = 0;

  private offset: number = 0;

  read(): number {
    const val = ((this.state >> this.offset++) & 0x01) | 0x40;
    this.offset %= 8;

    return val;
  }

  pressButton(btn: Button): void {
    this.state |= btn;
  }

  releaseButton(btn: Button): void {
    this.state &= ~btn;
  }

  reset(): void {
    this.state = this.offset = 0;
  }
}
