import { APU } from './apu';
import { Controller } from './controller';
import { CPU, CPUBus } from './cpu';
import { Mapper } from './mapper';
import { PPU, PPUBus } from './ppu';
import { Screen } from './screen';

export class Console {
  private cpu!: CPU;

  private ppu!: PPU;

  private apu!: APU;

  private mapper!: Mapper;

  private rafId: number = 0;

  constructor(
    private screen: Screen,
    private controller1: Controller,
    private controller2: Controller
  ) {}

  async play(mapper: Mapper): Promise<void> {
    this.destroy();
    await this.init(mapper);
    this.startGameLoop();
  }

  private async init(mapper: Mapper): Promise<void> {
    if (!this.apu) {
      this.apu = new APU();
      await this.apu.init();
    }

    this.mapper = mapper;
    this.ppu = new PPU(new PPUBus(this.mapper), this.screen);
    this.cpu = new CPU(
      new CPUBus(
        this.ppu,
        this.apu,
        this.mapper,
        this.controller1,
        this.controller2
      )
    );
    this.cpu.reset();
  }

  private destroy(): void {
    this.stopGameLoop();
    this.screen?.clear();
    this.apu?.reset();
    this.controller1?.reset();
    this.controller2?.reset();
    this.cpu = this.ppu = this.mapper = null!;
  }

  private startGameLoop(): void {
    const frame = 1000 / 60;
    let time = 0;
    let prev = 0;

    const loop = (now: number) => {
      time += now - prev;
      const skip = time < frame;
      prev = now;
      time %= frame;
      let done = 0;

      while (!done && !skip) {
        let cycles = this.cpu.execStart() - 1;

        while (cycles--) {
          this.apu.tick();
          done |= this.ppu.tick();
          done |= this.ppu.tick();
          done |= this.ppu.tick();
        }

        this.apu.tick();
        done |= this.ppu.tick();

        this.ppu.isNMI() && this.cpu.nmi();
        (this.mapper.isIRQ() || this.apu.isIRQ()) && this.cpu.irq();

        done |= this.ppu.tick();
        done |= this.ppu.tick();

        this.cpu.execEnd();

        this.ppu.isNMI() && this.cpu.nmi();
      }

      this.rafId = requestAnimationFrame(loop);
    };

    loop(0);
  }

  private stopGameLoop(): void {
    cancelAnimationFrame(this.rafId);
  }
}
