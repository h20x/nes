import { Mapper, Mirroring } from './mapper';

export class Mapper1 extends Mapper {
  // load register
  private lr: number = 0x0200;

  // control register
  private cr: number = 0x0c;

  reset(): void {
    this.lr = 0x0200;
    this.cr |= 0x0c;
    this.prgBank[1] = (this.prgBanksLen() - 1) * this.prgBankSize;
  }

  cpuWrite(addr: number, val: number): void {
    if (addr < 0x8000) {
      return super.cpuWrite(addr, val);
    }

    if (val & 0x80) {
      return this.reset();
    }

    this.lr |= (val & 0x01) << 4;

    // load register is not full
    if ((this.lr & 0x20) === 0) {
      this.lr >>= 1;

      return;
    }

    const reg = (addr >> 13) & 0x03;
    const data = this.lr & 0x1f;
    this.lr = 0x0200;

    // control register
    if (0 === reg) {
      const m = data & 0x03;

      if (0 === m) this.mirroring = Mirroring.SingleScreenLo;
      else if (1 === m) this.mirroring = Mirroring.SingleScreenHi;
      else if (2 === m) this.mirroring = Mirroring.Vertical;
      else if (3 === m) this.mirroring = Mirroring.Horizontal;

      this.cr = data;

      return;
    }

    // CHR bank 0
    if (1 === reg) {
      // 4KB mode
      if (this.cr & 0x10) {
        this.chrBank[0] = data * this.chrBankSize;
      }
      // 8KB mode
      else {
        this.chrBank[0] = ((data & 0x1e) >> 1) * this.chrBankSize * 2;
        this.chrBank[1] = this.chrBank[0] + this.chrBankSize;
      }

      return;
    }

    // CHR bank 1
    if (2 === reg) {
      // 4KB mode
      if (this.cr & 0x10) {
        this.chrBank[1] = data * this.chrBankSize;
      }

      return;
    }

    // PRG bank
    if (3 === reg) {
      const bankMode = (this.cr & 0x0c) >> 2;

      if (bankMode < 2) {
        this.prgBank[0] = ((data & 0x0e) >> 1) * this.prgBankSize * 2;
        this.prgBank[1] = this.prgBank[0] + this.prgBankSize;
      } else if (2 === bankMode) {
        this.prgBank[0] = 0;
        this.prgBank[1] = (data & 0x0f) * this.prgBankSize;
      } else if (3 === bankMode) {
        this.prgBank[0] = (data & 0x0f) * this.prgBankSize;
        this.prgBank[1] = (this.prgBanksLen() - 1) * this.prgBankSize;
      }
    }
  }
}
