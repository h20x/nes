import { Ram } from './ram';

export class Bus {
  private ram!: Ram;

  setRam(ram: Ram) {
    this.ram = ram;
  }

  read(addr: number): number {
    return this.ram.read(addr);
  }

  write(addr: number, val: number): void {
    this.ram.write(addr, val);
  }
}
