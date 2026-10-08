export class Bus {
  constructor(private wmodule: TWasmModule) {}

  read(addr: number): number {
    return this.wmodule._busRead(addr);
  }

  write(addr: number, val: number): void {
    this.wmodule._busWrite(addr, val);
  }
}
