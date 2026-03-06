import { Bus } from '../bus';
import { Mapper } from '../mapper';

export class PPUBus implements Bus {
  private palette: Uint8Array = new Uint8Array(32);

  constructor(private mapper: Mapper) {}

  read(addr: number): number {
    addr &= 0x3fff;

    if (this.mapper.ppuAddrMapped(addr)) {
      return this.mapper.ppuRead(addr);
    } else if (addr >= 0x3f00 && addr <= 0x3fff) {
      addr &= addr % 4 ? 0x1f : 0x00;

      return this.palette[addr];
    } else {
      throw new Error(`Unmapped address 0x${addr.toString(16)}`);
    }
  }

  write(addr: number, val: number): void {
    addr &= 0x3fff;
    val &= 0xff;

    if (this.mapper.ppuAddrMapped(addr)) {
      this.mapper.ppuWrite(addr, val);
    } else if (addr >= 0x3f00 && addr <= 0x3fff) {
      addr &= addr % 4 ? 0x1f : 0x0f;
      this.palette[addr] = val;
    } else {
      throw new Error(`Unmapped address 0x${addr.toString(16)}`);
    }
  }

  scanline(): void {
    this.mapper.scanline();
  }
}
