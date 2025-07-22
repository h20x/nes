export class Ram {
  private mem: number[] = new Array(2 ** 16);

  read(addr: number): number {
    this.checkAddr(addr);

    return this.mem[addr] ?? 0;
  }

  write(addr: number, val: number): void {
    this.checkAddr(addr);
    this.mem[addr] = val;
  }

  private checkAddr(addr: number): void {
    if (addr < 0 || addr >= this.mem.length) {
      const hex = addr.toString(16).padStart(4, '0');
      throw new Error(`Out of range. Address: ${hex}`);
    }
  }
}
