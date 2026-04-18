import { ICPUBus } from '../src/console/bus';

export class TestBus implements ICPUBus {
  private ram: Uint8Array = new Uint8Array(65536);

  read(addr: number): number {
    return this.ram[addr];
  }

  write(addr: number, val: number): void {
    this.ram[addr] = val;
  }

  copyOAM(addr: number): void {}
}
