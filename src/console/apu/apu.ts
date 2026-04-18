import { Bus } from '../bus';
import { DMC } from './dmc';
import { FrameCounter } from './frame-counter';
import { Mixer } from './mixer';
import { Noise } from './noise';
import { Pulse } from './pulse';
import { Triangle } from './triangle';

export enum APURegister {
  Pulse10,
  Pulse11,
  Pulse12,
  Pulse13,

  Pulse20,
  Pulse21,
  Pulse22,
  Pulse23,

  Triangle0,
  Triangle1,
  Triangle2,
  Triangle3,

  Noise0,
  Noise1,
  Noise2,
  Noise3,

  DMC0,
  DMC1,
  DMC2,
  DMC3,

  Status = 0x15,
  FrameCounter = 0x17,
}

export class APU {
  private cycles: number = 0;

  private frameCounter: FrameCounter = new FrameCounter();

  private pulse1: Pulse = new Pulse(true);

  private pulse2: Pulse = new Pulse();

  private triangle: Triangle = new Triangle();

  private noise: Noise = new Noise();

  private dmc: DMC = new DMC();

  private mixer: Mixer = new Mixer();

  async init(): Promise<void> {
    await this.mixer.init();
  }

  tick(): void {
    ++this.cycles;

    let q = 0;

    if (this.cycles % 2 === 0) {
      q = this.frameCounter.tick();
      this.pulse1.tick(q);
      this.pulse2.tick(q);
      this.noise.tick(q);
      this.dmc.tick();
    }

    this.triangle.tick(q);

    if (this.cycles % 41 === 0) {
      this.mixer.mix(
        this.pulse1.output(),
        this.pulse2.output(),
        this.triangle.output(),
        this.noise.output(),
        this.dmc.output()
      );
    }
  }

  register(reg: APURegister): number;
  register(reg: APURegister, val: number): void;
  register(reg: APURegister, val?: number): void | number {
    if (val == null) {
      if (APURegister.Status === reg) {
        const status =
          (this.pulse1.isEnabled() ? 0x01 : 0) |
          (this.pulse2.isEnabled() ? 0x02 : 0) |
          (this.triangle.isEnabled() ? 0x04 : 0) |
          (this.noise.isEnabled() ? 0x08 : 0) |
          (this.dmc.hasRemainingBytes() ? 0x10 : 0) |
          (this.frameCounter.isIRQ() ? 0x40 : 0) |
          (this.dmc.isIRQ() ? 0x80 : 0);

        this.frameCounter.clearIRQ();

        return status;
      }

      return 0;
    }

    if (reg >= APURegister.Pulse10 && reg <= APURegister.Pulse13) {
      this.pulse1.register(reg % 4, val);
    } else if (reg >= APURegister.Pulse20 && reg <= APURegister.Pulse23) {
      this.pulse2.register(reg % 4, val);
    } else if (reg >= APURegister.Triangle0 && reg <= APURegister.Triangle3) {
      this.triangle.register(reg % 4, val);
    } else if (reg >= APURegister.Noise0 && reg <= APURegister.Noise3) {
      this.noise.register(reg % 4, val);
    } else if (reg >= APURegister.DMC0 && reg <= APURegister.DMC3) {
      this.dmc.register(reg % 4, val);
    } else if (APURegister.Status === reg) {
      this.pulse1.setEnabled(val & 0x01);
      this.pulse2.setEnabled(val & 0x02);
      this.triangle.setEnabled(val & 0x04);
      this.noise.setEnabled(val & 0x08);
      this.dmc.clearIRQ();
      val & 0x10 ? this.dmc.start() : this.dmc.stop();
    } else if (APURegister.FrameCounter === reg) {
      this.frameCounter.setMode(val & 0x80);
      this.frameCounter.setInterruptInhibitFlag(val & 0x40);
      this.frameCounter.reset();

      if (val & 0x80) {
        this.pulse1.tick(2);
        this.pulse2.tick(2);
        this.triangle.tick(2);
        this.noise.tick(2);
      }
    }
  }

  reset(): void {
    this.cycles = 0;
    this.pulse1.setEnabled(0);
    this.pulse2.setEnabled(0);
    this.triangle.setEnabled(0);
    this.noise.setEnabled(0);
    this.dmc.stop();
    this.dmc.clearIRQ();
    this.frameCounter.clearIRQ();
  }

  isIRQ(): boolean {
    return this.frameCounter.isIRQ() || this.dmc.isIRQ();
  }

  setBus(bus: Bus): void {
    this.dmc.setBus(bus);
  }
}
