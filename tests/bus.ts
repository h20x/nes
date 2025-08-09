import { Bus } from '../src/bus';

export class TestBus implements Bus {
  private ram: number[] = new Array(65536).fill(0);

  read(addr: number): number {
    return this.ram[addr];
  }

  write(addr: number, val: number): void {
    this.ram[addr] = val;
  }
}
