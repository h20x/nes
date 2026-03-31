import { Bus } from '../bus';

export class DMC {
  private static LT = [
    214, 190, 170, 160, 143, 127, 113, 107, 95, 80, 71, 64, 53, 42, 36, 27,
  ];

  private bus!: Bus;

  private stopped: number = 1;

  private irqEnabled: number = 0;

  private irq: number = 0;

  private loop: number = 0;

  private outputVal: number = 0;

  private period: number = 0;

  private periodCounter: number = 0;

  private shifter: number = 0x8000;

  private baseAddr: number = 0;

  private curAddr: number = 0;

  private bytes: number = 0;

  private bytesCounter: number = 0;

  private buffer: number = -1;

  tick(): void {
    --this.periodCounter;

    if (this.periodCounter > 0) {
      return;
    }

    this.periodCounter = this.period;

    if (!this.stopped) {
      this.updateOutput();
    }

    this.shifter >>= 1;

    if (this.shifter != 0x80) {
      return;
    }

    this.shifter = 0x8000;

    if (this.buffer < 0) {
      this.stopped = 1;

      return;
    }

    this.shifter |= this.buffer;
    this.buffer = -1;
    this.stopped = 0;

    if (this.bytesCounter === 0) {
      return;
    }

    this.fetchNextByte();

    if (this.bytesCounter > 0) {
      return;
    }

    if (this.loop) {
      this.start();
    } else {
      this.irq = this.irqEnabled;
    }
  }

  register(reg: number, val: number): void {
    if (0 === reg) {
      this.irqEnabled = val & 0x80;
      this.irq = this.irqEnabled && this.irq;
      this.loop = val & 0x40;
      this.period = DMC.LT[val & 0x0f];
    } else if (1 === reg) {
      this.outputVal = val & 0x7f;
    } else if (2 === reg) {
      this.baseAddr = 0xc000 | (val << 6);
    } else if (3 === reg) {
      this.bytes = (val << 4) | 0x01;
    }
  }

  output(): number {
    return this.outputVal;
  }

  start(): void {
    if (this.bytesCounter > 0) {
      return;
    }

    this.curAddr = this.baseAddr;
    this.bytesCounter = this.bytes;

    if (this.buffer < 0) {
      this.fetchNextByte();
    }

    if (this.bytesCounter === 0) {
      this.irq = this.irqEnabled;
    }
  }

  stop(): void {
    this.bytesCounter = 0;
  }

  clearIRQ(): void {
    this.irq = 0;
  }

  isIRQ(): boolean {
    return this.irq !== 0;
  }

  hasRemainingBytes(): boolean {
    return this.bytesCounter > 0;
  }

  setBus(bus: Bus): void {
    this.bus = bus;
  }

  private updateOutput(): void {
    if (this.shifter & 0x01 && this.outputVal <= 125) {
      this.outputVal += 2;
    } else if (!(this.shifter & 0x01) && this.outputVal >= 2) {
      this.outputVal -= 2;
    }
  }

  private fetchNextByte(): void {
    this.buffer = this.bus.read(this.curAddr++);

    if (this.curAddr > 0xffff) {
      this.curAddr = 0x8000;
    }

    --this.bytesCounter;
  }
}
