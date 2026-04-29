import { Envelope } from './envelope';
import { LengthCounter } from './length-counter';
import { OutputUnit } from './output-unit';
import { Sweep } from './sweep';

export class Pulse {
  private static LT = [
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 1, 1, 1],
  ];

  private period: number = 0;

  private periodCounter: number = 0;

  private sequencer: number = 0;

  private dutySeq: number[] = [];

  private envelope: Envelope = new Envelope();

  private counter: LengthCounter = new LengthCounter();

  private outputUnit: OutputUnit = new OutputUnit();

  private sweep: Sweep;

  constructor(ch1: boolean = false) {
    this.sweep = new Sweep(ch1);
  }

  tick(q: number, even: boolean = false): void {
    q > 0 && this.envelope.tick();
    q > 1 && this.counter.tick();
    q > 1 && this.sweep.tick();

    if (!even) {
      return;
    }

    if (this.periodCounter === 0) {
      this.outputUnit.set(
        this.sweep.isMuted() || this.counter.isMuted()
          ? 0
          : this.envelope.getVolume() * this.dutySeq[this.sequencer]
      );

      this.periodCounter = this.sweep.getPulsePeriod();
      this.sequencer = (this.sequencer + 1) % 8;
    } else {
      --this.periodCounter;
    }
  }

  register(reg: number, val: number): void {
    if (0 === reg) {
      this.dutySeq = Pulse.LT[(val >> 6) & 0x03];
      this.counter.setHalt(val & 0x20);
      this.envelope.setLoop(val & 0x20);
      this.envelope.setConstVolumeMode(val & 0x10);
      this.envelope.setVolume(val & 0x0f);
    } else if (1 === reg) {
      this.sweep.setEnabled(val & 0x80);
      this.sweep.setPeriod((val >> 4) & 0x07);
      this.sweep.setNegate(val & 0x08);
      this.sweep.setShift(val & 0x07);
      this.sweep.setReloadFlag();
    } else if (2 === reg) {
      this.period = (this.period & ~0xff) | val;
      this.sweep.setPulsePeriod(this.period);
    } else if (3 === reg) {
      this.sequencer = 0;
      this.period = (this.period & ~0x0700) | ((val & 0x07) << 8);
      this.sweep.setPulsePeriod(this.period);
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
}
