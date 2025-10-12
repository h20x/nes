import { Mapper, Mirroring } from './mapper';

export class Mapper7 extends Mapper {
  cpuWrite(addr: number, val: number): void {
    if (addr < 0x8000) {
      return super.cpuWrite(addr, val);
    }

    this.prgBank[0] = (val & 0x07) * this.prgBankSize * 2;
    this.prgBank[1] = this.prgBank[0] + this.prgBankSize;
    this.mirroring =
      val & 0x10 ? Mirroring.SingleScreenHi : Mirroring.SingleScreenLo;
  }
}
