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

export type ControllerKeys = Record<string, Button>;

export class Controller {
  private state: number = 0;

  private offset: number = 0;

  private keys!: ControllerKeys;

  constructor() {
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.keyUpHandler = this.keyUpHandler.bind(this);
  }

  bindKeys(keys: ControllerKeys): void {
    if (this.keys == null) {
      document.addEventListener('keydown', this.keyDownHandler);
      document.addEventListener('keyup', this.keyUpHandler);
    }

    this.keys = keys;
  }

  unbindKeys(): void {
    this.keys = null!;
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
  }

  read(): number {
    const val = ((this.state >> this.offset++) & 0x01) | 0x40;
    this.offset %= 8;

    return val;
  }

  private keyDownHandler(e: KeyboardEvent): void {
    if (this.keys[e.code] != null) {
      this.state |= this.keys[e.code];
      e.preventDefault();
    }
  }

  private keyUpHandler(e: KeyboardEvent): void {
    if (this.keys[e.code] != null) {
      this.state &= ~this.keys[e.code];
      e.preventDefault();
    }
  }
}
