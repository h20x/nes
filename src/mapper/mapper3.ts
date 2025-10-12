import { Mapper } from './mapper';

export class Mapper3 extends Mapper {
  cpuWrite(addr: number, val: number): void {
    if (addr < 0x8000) {
      return super.cpuWrite(addr, val);
    }

    this.chrBank[0] = (val & 0x03) * this.chrBankSize * 2;
    this.chrBank[1] = this.chrBank[0] + this.chrBankSize;
  }
}
