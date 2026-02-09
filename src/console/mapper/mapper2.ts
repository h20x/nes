import { Mapper } from './mapper';

export class Mapper2 extends Mapper {
  cpuWrite(addr: number, val: number): void {
    if (addr < 0x8000) {
      return super.cpuWrite(addr, val);
    }

    this.prgBank[0] = (val & 0x0f) * this.prgBankSize;
  }
}
