import { Mapper, Mirroring } from './mapper';

export class Mapper4 extends Mapper {
  protected prgBank: number[] = new Array(4).fill(0);

  protected chrBank: number[] = new Array(8).fill(0);

  private bankRegister: number = 0;

  private irq: boolean = false;

  private irqCounter: number = 0;

  private irqReloadValue: number = 0;

  private irqEnabled: boolean = false;

  constructor(
    prg: ArrayLike<number>,
    chr: ArrayLike<number>,
    mirroring: Mirroring,
    altNametableLayout: number
  ) {
    super(prg, chr, mirroring, altNametableLayout);

    this.prgBankSize = 8192;
    this.chrBankSize = 1024;
    this.prgBank[0] =
      this.prgBank[1] =
      this.prgBank[2] =
        (this.prgBanksLen() - 2) * this.prgBankSize;
    this.prgBank[3] = (this.prgBanksLen() - 1) * this.prgBankSize;

    if (altNametableLayout) {
      this.mirroring = Mirroring.FourScreen;
    }
  }

  cpuRead(addr: number): number {
    if (addr < 0x8000) {
      return super.cpuRead(addr);
    }

    let bank = this.prgBank[3];

    if (addr < 0xa000) bank = this.prgBank[0];
    else if (addr < 0xc000) bank = this.prgBank[1];
    else if (addr < 0xe000) bank = this.prgBank[2];

    return this.prg[bank | (addr & 0x1fff)];
  }

  cpuWrite(addr: number, val: number): void {
    if (addr < 0x8000) {
      return super.cpuWrite(addr, val);
    }

    // bank select
    if (addr >= 0x0800 && addr <= 0x9fff && (addr & 0x01) === 0) {
      this.bankRegister = val;
    }
    // bank data
    else if (addr >= 0x0800 && addr <= 0x9fff && (addr & 0x01) === 1) {
      const r = this.bankRegister & 0x07;
      const prgMode = (this.bankRegister & 0x40) >> 6;
      const chrMode = (this.bankRegister & 0x80) >> 7;

      if (0 === r) {
        this.chrBank[4 * chrMode] = (val & 0xfe) * this.chrBankSize;
        this.chrBank[4 * chrMode + 1] = ((val & 0xfe) + 1) * this.chrBankSize;
      } else if (1 === r) {
        this.chrBank[4 * chrMode + 2] = (val & 0xfe) * this.chrBankSize;
        this.chrBank[4 * chrMode + 3] = ((val & 0xfe) + 1) * this.chrBankSize;
      } else if (2 === r) {
        this.chrBank[chrMode ? 0 : 4] = val * this.chrBankSize;
      } else if (3 === r) {
        this.chrBank[chrMode ? 1 : 5] = val * this.chrBankSize;
      } else if (4 === r) {
        this.chrBank[chrMode ? 2 : 6] = val * this.chrBankSize;
      } else if (5 === r) {
        this.chrBank[chrMode ? 3 : 7] = val * this.chrBankSize;
      } else if (6 === r) {
        this.prgBank[prgMode ? 2 : 0] =
          ((val & 0x3f) % this.prgBanksLen()) * this.prgBankSize;
        this.prgBank[prgMode ? 0 : 2] =
          (this.prgBanksLen() - 2) * this.prgBankSize;
      } else if (7 === r) {
        this.prgBank[1] =
          ((val & 0x3f) % this.prgBanksLen()) * this.prgBankSize;
      }
    }
    // nametable arrangement
    else if (addr >= 0xa000 && addr <= 0xbfff && (addr & 0x01) === 0) {
      if (!this.altNametableLayout) {
        this.mirroring = val & 0x01 ? Mirroring.Horizontal : Mirroring.Vertical;
      }
    }
    // irq latch
    else if (addr >= 0xc000 && addr <= 0xdfff && (addr & 0x01) === 0) {
      this.irqReloadValue = val;
    }
    // irq reload
    else if (addr >= 0xc000 && addr <= 0xdfff && (addr & 0x01) === 1) {
      this.irqCounter = 0;
    }
    // irq disable
    else if (addr >= 0xe000 && addr <= 0xffff && (addr & 0x01) === 0) {
      this.irq = false;
      this.irqEnabled = false;
    }
    // irq enable
    else if (addr >= 0xe000 && addr <= 0xffff && (addr & 0x01) === 1) {
      this.irqEnabled = true;
    }
  }

  ppuRead(addr: number): number {
    if (addr >= 0x2000) {
      return super.ppuRead(addr);
    }

    return this.chr[this.getCHRBank(addr) | (addr & 0x03ff)];
  }

  ppuWrite(addr: number, val: number): void {
    if (addr >= 0x2000) {
      return super.ppuWrite(addr, val);
    }

    (this.chr as any)[this.getCHRBank(addr) | (addr & 0x03ff)] = val;
  }

  isIRQ(): boolean {
    const f = this.irq;
    this.irq = false;

    return f;
  }

  scanline(): void {
    if (this.irqCounter === 0) {
      this.irqCounter = this.irqReloadValue;
    } else {
      --this.irqCounter;
    }

    if (this.irqCounter === 0 && this.irqEnabled) {
      this.irq = true;
    }
  }

  private getCHRBank(addr: number): number {
    let bank = this.chrBank[7];

    if (addr < 0x0400) bank = this.chrBank[0];
    else if (addr < 0x0800) bank = this.chrBank[1];
    else if (addr < 0x0c00) bank = this.chrBank[2];
    else if (addr < 0x1000) bank = this.chrBank[3];
    else if (addr < 0x1400) bank = this.chrBank[4];
    else if (addr < 0x1800) bank = this.chrBank[5];
    else if (addr < 0x1c00) bank = this.chrBank[6];

    return bank;
  }
}
