import { Mapper, Mirroring } from '../mapper/mapper';

export class PPUBus {
  private nametable0: number[] = new Array(1024).fill(0);

  private nametable1: number[] = new Array(1024).fill(0);

  private palette: number[] = new Array(32).fill(0);

  constructor(private mapper: Mapper) {}

  read(addr: number): number {
    addr &= 0x3fff;

    if (this.mapper.ppuAddrMapped(addr)) {
      return this.mapper.ppuRead(addr);
    } else if (addr >= 0x2000 && addr <= 0x3eff) {
      return this.getNametable(addr)[addr & 0x03ff];
    } else if (addr >= 0x3f00 && addr <= 0x3fff) {
      addr &= 0x1f;

      return this.palette[addr % 4 ? addr : 0];
    } else {
      throw new Error(`Address unmapped: ${addr.toString(16)}`);
    }
  }

  write(addr: number, val: number): void {
    addr &= 0x3fff;
    val &= 0xff;

    if (this.mapper.ppuAddrMapped(addr)) {
      this.mapper.ppuWrite(addr, val);
    } else if (addr >= 0x2000 && addr <= 0x3eff) {
      this.getNametable(addr)[addr & 0x03ff] = val;
    } else if (addr >= 0x3f00 && addr <= 0x3fff) {
      addr &= 0x1f;
      this.palette[addr % 4 ? addr : 0] = val;
    } else {
      throw new Error(`Address unmapped: ${addr.toString(16)}`);
    }
  }

  private getNametable(addr: number): number[] {
    addr &= 0x0fff;

    if (Mirroring.Horizontal === this.mapper.getMirroring()) {
      return addr >= 0x0000 && addr <= 0x07ff
        ? this.nametable0
        : this.nametable1;
    }

    return (addr >= 0x0000 && addr <= 0x03ff) ||
      (addr >= 0x0800 && addr <= 0x0bff)
      ? this.nametable0
      : this.nametable1;
  }
}
