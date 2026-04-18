export interface Bus {
  read(addr: number): number;
  write(addr: number, val: number): void;
}

export interface ICPUBus extends Bus {
  copyOAM(addr: number): void;
}
