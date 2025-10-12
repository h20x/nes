import { Button, Controller, ControllerKeys } from './controller';
import { CPU } from './cpu/cpu';
import { CPUBus } from './cpu/cpu-bus';
import { Mapper, Mirroring } from './mapper/mapper';
import { Mapper0 } from './mapper/mapper0';
import { Mapper1 } from './mapper/mapper1';
import { Mapper2 } from './mapper/mapper2';
import { Mapper3 } from './mapper/mapper3';
import { Mapper4 } from './mapper/mapper4';
import { Mapper7 } from './mapper/mapper7';
import { PPU } from './ppu/ppu';
import { PPUBus } from './ppu/ppu-bus';
import { CanvasScreen } from './screen/canvas-screen';
import { Screen } from './screen/screen';

const DEFAULT_KEYS: ControllerKeys = {
  KeyZ: Button.A,
  KeyX: Button.B,
  Backspace: Button.Select,
  Enter: Button.Start,
  ArrowUp: Button.Up,
  ArrowDown: Button.Down,
  ArrowLeft: Button.Left,
  ArrowRight: Button.Right,
};

export class NES {
  private cpu!: CPU;

  private ppu!: PPU;

  private mapper!: Mapper;

  private screen!: Screen;

  private controller1!: Controller;

  private controller2!: Controller;

  private rafId: number = 0;

  play(gameFile: ArrayBuffer, keys: ControllerKeys = DEFAULT_KEYS): void {
    this.destroy();
    this.init(gameFile, keys);
    this.reset();
    this.startGameLoop();
  }

  reset(): void {
    this.cpu?.reset();
    this.ppu?.reset();
  }

  private init(gameFile: ArrayBuffer, keys: ControllerKeys): void {
    this.mapper = this.createMapper(gameFile);
    this.screen = new CanvasScreen(
      document.getElementById('screen') as HTMLCanvasElement
    );
    this.ppu = new PPU(new PPUBus(this.mapper), this.screen);
    this.controller1 = new Controller();
    this.controller1.bindKeys(keys);
    this.controller2 = new Controller();
    this.cpu = new CPU(
      new CPUBus(this.ppu, this.mapper, this.controller1, this.controller2)
    );
  }

  private destroy(): void {
    this.stopGameLoop();
    this.screen?.clear();
    this.controller1?.unbindKeys();
    this.cpu = this.ppu = this.screen = this.mapper = null!;
    this.controller1 = this.controller2 = null!;
  }

  private startGameLoop(): void {
    const loop = () => {
      let done = 0;

      while (!done) {
        done |= this.ppu.tick();
        this.ppu.isNMI() && this.cpu.nmi();
        this.mapper.isIRQ() && this.cpu.irq();
        this.cpu.tick();
        done |= this.ppu.tick();
        done |= this.ppu.tick();
      }

      this.rafId = requestAnimationFrame(loop);
    };

    loop();
  }

  private stopGameLoop(): void {
    cancelAnimationFrame(this.rafId);
  }

  private createMapper(buffer: ArrayBuffer): Mapper {
    const arr = new Uint8Array(buffer, 0, buffer.byteLength);

    if (`${arr[0]}${arr[1]}${arr[2]}${arr[3]}` !== '78698326') {
      throw new Error('Invalid header format');
    }

    const headerSize = 16;
    const prgSize = this.calcPrgSize(arr);
    const chrSize = this.calcChrSize(arr);
    const mirroring = arr[6] & 0x01 ? Mirroring.Vertical : Mirroring.Horizontal;
    const altNametableLayout = arr[6] & 0x08;
    const trainer = Boolean(arr[6] & 0x04);
    const trainerSize = trainer ? 512 : 0;
    const mapperNum = ((arr[6] & 0xf0) >> 4) | (arr[7] & 0xf0);
    const prgStart = headerSize + trainerSize;
    const prgEnd = prgStart + prgSize;
    const prg = arr.slice(prgStart, prgEnd);
    const chr = chrSize ? arr.slice(prgEnd, prgEnd + chrSize) : new Array(8192);

    switch (mapperNum) {
      case 0:
        return new Mapper0(prg, chr, mirroring, altNametableLayout);

      case 1:
        return new Mapper1(prg, chr, mirroring, altNametableLayout);

      case 2:
        return new Mapper2(prg, chr, mirroring, altNametableLayout);

      case 3:
        return new Mapper3(prg, chr, mirroring, altNametableLayout);

      case 4:
        return new Mapper4(prg, chr, mirroring, altNametableLayout);

      case 7:
        return new Mapper7(prg, chr, mirroring, altNametableLayout);

      default:
        throw new Error(`Unsupported mapper: ${mapperNum}`);
    }
  }

  private calcPrgSize(arr: Uint8Array): number {
    const nes2format = (arr[7] & 0x0c) === 0x08;

    if (!nes2format) {
      return arr[4] * 16384;
    }

    const hi = arr[9] & 0x0f;

    if (hi < 0x0f) {
      return ((hi << 8) | arr[4]) * 16384;
    }

    const m = arr[4] & 0x03;
    const e = (arr[4] & 0xfc) >> 2;

    return 2 ** e * (m * 2 + 1);
  }

  private calcChrSize(arr: Uint8Array): number {
    const nes2format = (arr[7] & 0x0c) === 0x08;

    if (!nes2format) {
      return arr[5] * 8192;
    }

    const hi = arr[9] & 0xf0;

    if (hi < 0x0f) {
      return ((hi << 4) | arr[5]) * 8192;
    }

    const m = arr[5] & 0x03;
    const e = (arr[5] & 0xfc) >> 2;

    return 2 ** e * (m * 2 + 1);
  }
}
