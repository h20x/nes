export interface Bus {
  read(addr: number): number;
  write(addr: number, val: number): void;
}
