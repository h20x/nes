export enum Mirroring {
  Horizontal,
  Vertical,
  SingleScreenLo,
  SingleScreenHi,
  FourScreen,
}

export class Mapper {
  private ram: number[] = new Array(0x8000 - 0x4020).fill(0);

  private nametable0: number[] = new Array(1024).fill(0);

  private nametable1: number[] = new Array(1024).fill(0);

  private nametable2: number[] = new Array(1024).fill(0);

  private nametable3: number[] = new Array(1024).fill(0);

  protected prgBank: number[] = new Array(2).fill(0);

  protected chrBank: number[] = new Array(2).fill(0);

  protected prgBankSize: number = 16384;

  protected chrBankSize: number = 4096;

  constructor(
    protected prg: ArrayLike<number>,
    protected chr: ArrayLike<number>,
    protected mirroring: Mirroring,
    protected altNametableLayout: number
  ) {
    this.prgBank[1] = (this.prgBanksLen() - 1) * this.prgBankSize;
    this.chrBank[1] = this.chrBankSize;
  }

  cpuRead(addr: number): number {
    if (addr >= 0x8000 && addr <= 0xbfff) {
      return this.prg[this.prgBank[0] | (addr & 0x3fff)];
    }

    if (addr >= 0xc000 && addr <= 0xffff) {
      return this.prg[this.prgBank[1] | (addr & 0x3fff)];
    }

    return this.ram[addr - 0x4020];
  }

  cpuWrite(addr: number, val: number): void {
    this.ram[addr - 0x4020] = val;
  }

  cpuAddrMapped(addr: number): boolean {
    return addr >= 0x4020 && addr <= 0xffff;
  }

  ppuRead(addr: number): number {
    if (addr < 0x1000) {
      return this.chr[this.chrBank[0] | (addr & 0x0fff)];
    }

    if (addr < 0x2000) {
      return this.chr[this.chrBank[1] | (addr & 0x0fff)];
    }

    return this.getNametable(addr)[addr & 0x03ff];
  }

  ppuWrite(addr: number, val: number): void {
    if (addr < 0x1000) {
      (this.chr as any)[this.chrBank[0] | (addr & 0x0fff)] = val;
    } else if (addr < 0x2000) {
      (this.chr as any)[this.chrBank[1] | (addr & 0x0fff)] = val;
    } else {
      this.getNametable(addr)[addr & 0x03ff] = val;
    }
  }

  ppuAddrMapped(addr: number): boolean {
    return addr >= 0x0000 && addr <= 0x3eff;
  }

  prgBanksLen(): number {
    return this.prg.length / this.prgBankSize;
  }

  chrgBanksLen(): number {
    return this.chr.length / this.chrBankSize;
  }

  isIRQ(): boolean {
    return false;
  }

  scanline(): void {}

  private getNametable(addr: number): number[] {
    addr &= 0x0fff;

    if (Mirroring.Horizontal === this.mirroring) {
      return addr >= 0x0000 && addr <= 0x07ff
        ? this.nametable0
        : this.nametable1;
    }

    if (Mirroring.Vertical === this.mirroring) {
      return (addr >= 0x0000 && addr <= 0x03ff) ||
        (addr >= 0x0800 && addr <= 0x0bff)
        ? this.nametable0
        : this.nametable1;
    }

    if (Mirroring.SingleScreenLo === this.mirroring) {
      return this.nametable0;
    }

    if (Mirroring.SingleScreenHi === this.mirroring) {
      return this.nametable1;
    }

    if (addr < 0x0400) {
      return this.nametable0;
    }

    if (addr < 0x0800) {
      return this.nametable1;
    }

    if (addr < 0x0c00) {
      return this.nametable2;
    }

    return this.nametable3;
  }
}
