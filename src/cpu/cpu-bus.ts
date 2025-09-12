import { Bus } from '../bus';
import { Controller } from '../controller';
import { Mapper } from '../mapper/mapper';
import { PPU } from '../ppu/ppu';

export class CPUBus implements Bus {
  private ram: number[] = new Array(2048).fill(0);

  constructor(
    private ppu: PPU,
    private mapper: Mapper,
    private controller1: Controller,
    private controller2: Controller
  ) {}

  read(addr: number): number {
    if (this.mapper.cpuAddrMapped(addr)) {
      return this.mapper.cpuRead(addr);
    } else if (addr >= 0x0000 && addr <= 0x1fff) {
      return this.ram[addr & 0x07ff];
    } else if (addr >= 0x2000 && addr <= 0x3fff) {
      return this.ppu.register(addr & 0x07);
    } else if (addr >= 0x4000 && addr <= 0x4017) {
      if (addr === 0x4016) {
        return this.controller1.read();
      }

      if (addr === 0x4017) {
        return this.controller2.read();
      }

      return 0;
    } else {
      throw new Error(`Address unmapped: ${addr.toString(16)}`);
    }
  }

  write(addr: number, val: number): void {
    if (this.mapper.cpuAddrMapped(addr)) {
      this.mapper.cpuWrite(addr, val);
    } else if (addr >= 0x0000 && addr <= 0x1fff) {
      this.ram[addr & 0x07ff] = val;
    } else if (addr >= 0x2000 && addr <= 0x3fff) {
      this.ppu.register(addr & 0x07, val);
    } else if (addr >= 0x4000 && addr <= 0x4017) {
    } else {
      throw new Error(`Address unmapped: ${addr.toString(16)}`);
    }
  }
}
