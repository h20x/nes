import { Envelope } from './envelope';
import { LengthCounter } from './length-counter';
import { OutputUnit } from './output-unit';

export class Noise {
  private static LT = [
    2, 4, 8, 16, 32, 48, 64, 80, 101, 127, 190, 254, 381, 508, 1017, 2034,
  ];

  private mode: number = 0;

  private period: number = 0;

  private periodCounter: number = 0;

  private shifter: number = 1;

  private envelope: Envelope = new Envelope();

  private counter: LengthCounter = new LengthCounter();

  private outputUnit: OutputUnit = new OutputUnit();

  tick(q: number): void {
    q > 0 && this.envelope.tick();
    q > 1 && this.counter.tick();

    if (this.periodCounter === 0) {
      this.outputUnit.set(
        this.counter.isMuted() || this.shifter & 0x01
          ? 0
          : this.envelope.getVolume()
      );

      this.clockShifter();
      this.periodCounter = this.period;
    } else {
      --this.periodCounter;
    }
  }

  register(reg: number, val: number): void {
    if (0 === reg) {
      this.counter.setHalt(val & 0x20);
      this.envelope.setLoop(val & 0x20);
      this.envelope.setConstVolumeMode(val & 0x10);
      this.envelope.setVolume(val & 0x0f);
    } else if (2 === reg) {
      this.mode = val & 0x80;
      this.period = Noise.LT[val & 0x0f];
    } else if (3 === reg) {
      this.counter.setValue((val >> 3) & 0x1f);
      this.envelope.setStartFlag();
    }
  }

  output(): number {
    return this.outputUnit.get();
  }

  isEnabled(): boolean {
    return !this.counter.isMuted();
  }

  setEnabled(v: number): void {
    this.counter.setEnabled(v);
  }

  private clockShifter(): void {
    const b = (this.mode ? this.shifter >> 6 : this.shifter >> 1) & 0x01;
    this.shifter = (this.shifter >> 1) | (((this.shifter & 0x01) ^ b) << 14);
  }
}
