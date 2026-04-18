import { APU } from './apu';
import { Button, Controller, ControllerKeys } from './controller';
import { CPU, CPUBus } from './cpu';
import { Mapper } from './mapper';
import { PPU, PPUBus } from './ppu';
import { Screen } from './screen';

const DEFAULT_KEYS: ControllerKeys = {
  KeyZ: Button.A,
  KeyX: Button.B,
  Tab: Button.Select,
  Enter: Button.Start,
  ArrowUp: Button.Up,
  ArrowDown: Button.Down,
  ArrowLeft: Button.Left,
  ArrowRight: Button.Right,
};

export class Console {
  private cpu!: CPU;

  private ppu!: PPU;

  private apu!: APU;

  private mapper!: Mapper;

  private controller1!: Controller;

  private controller2!: Controller;

  private rafId: number = 0;

  constructor(
    private screen: Screen,
    private keys: ControllerKeys = DEFAULT_KEYS
  ) {}

  async play(mapper: Mapper): Promise<void> {
    this.destroy();
    await this.init(mapper);
    this.reset();
    this.startGameLoop();
  }

  private reset(): void {
    this.cpu?.reset();
    this.ppu?.reset();
    this.apu?.reset();
  }

  private async init(mapper: Mapper): Promise<void> {
    if (!this.apu) {
      this.apu = new APU();
      await this.apu.init();
    }

    this.mapper = mapper;
    this.ppu = new PPU(new PPUBus(this.mapper), this.screen);
    this.controller1 = new Controller();
    this.controller2 = new Controller();
    this.controller1.bindKeys(this.keys);
    this.cpu = new CPU(
      new CPUBus(
        this.ppu,
        this.apu,
        this.mapper,
        this.controller1,
        this.controller2
      )
    );
  }

  private destroy(): void {
    this.stopGameLoop();
    this.screen?.clear();
    this.controller1?.unbindKeys();
    this.cpu = this.ppu = this.mapper = null!;
    this.controller1 = this.controller2 = null!;
  }

  private startGameLoop(): void {
    const loop = () => {
      let done = 0;

      while (!done) {
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

    loop();
  }

  private stopGameLoop(): void {
    cancelAnimationFrame(this.rafId);
  }
}
