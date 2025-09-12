import { Mapper } from './mapper';

export class Mapper0 extends Mapper {
  cpuRead(addr: number): number {
    return this.prg[addr & (this.prg.length - 1)];
  }

  cpuWrite(addr: number, val: number): void {
    this.prg[addr & (this.prg.length - 1)] = val;
  }

  cpuAddrMapped(addr: number): boolean {
    return addr >= 0x8000 && addr <= 0xffff;
  }

  ppuRead(addr: number): number {
    return this.chr[addr & (this.chr.length - 1)];
  }

  ppuWrite(addr: number, val: number): void {
    this.chr[addr & (this.chr.length - 1)] = val;
  }

  ppuAddrMapped(addr: number): boolean {
    return addr >= 0x0000 && addr <= 0x1fff;
  }
}
