import { LengthCounter } from './length-counter';
import { LinearCounter } from './linear-counter';
import { OutputUnit } from './output-unit';

export class Triangle {
  private static SEQ = [
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 11, 12, 13, 14, 15,
  ];

  private period: number = 0;

  private periodCounter: number = 0;

  private sequencer: number = 0;

  private lengthCounter: LengthCounter = new LengthCounter();

  private linearCounter: LinearCounter = new LinearCounter();

  private outputUnit: OutputUnit = new OutputUnit();

  tick(q: number): void {
    q > 0 && this.linearCounter.tick();
    q > 1 && this.lengthCounter.tick();

    if (this.periodCounter === 0) {
      this.outputUnit.set(
        this.lengthCounter.isMuted() ||
          this.linearCounter.isMuted() ||
          this.period < 2
          ? 0
          : Triangle.SEQ[this.sequencer]
      );

      this.periodCounter = this.period;
      this.sequencer = (this.sequencer + 1) % 32;
    } else {
      --this.periodCounter;
    }
  }

  register(reg: number, val: number): void {
    if (0 === reg) {
      this.lengthCounter.setHalt(val & 0x80);
      this.linearCounter.setControlFlag(val & 0x80);
      this.linearCounter.setReloadValue(val & 0x7f);
    } else if (2 === reg) {
      this.period = (this.period & ~0xff) | val;
    } else if (3 === reg) {
      this.period = (this.period & ~0x700) | ((val & 0x07) << 8);
      this.lengthCounter.setValue((val >> 3) & 0x1f);
      this.linearCounter.setReloadFlag();
    }
  }

  output(): number {
    return this.outputUnit.get();
  }

  isEnabled(): boolean {
    return !this.lengthCounter.isMuted();
  }

  setEnabled(v: number): void {
    this.lengthCounter.setEnabled(v);
  }
}
