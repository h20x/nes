export enum Mirroring {
  Horizontal,
  Vertical,
}

interface ArrayLike<T> {
  readonly length: number;
  [n: number]: T;
}

export abstract class Mapper {
  constructor(
    protected prg: ArrayLike<number>,
    protected chr: ArrayLike<number>,
    protected mirroring: Mirroring
  ) {}

  getMirroring(): Mirroring {
    return this.mirroring;
  }

  abstract cpuRead(addr: number): number;

  abstract cpuWrite(addr: number, val: number): void;

  abstract cpuAddrMapped(addr: number): boolean;

  abstract ppuRead(addr: number): number;

  abstract ppuWrite(addr: number, val: number): void;

  abstract ppuAddrMapped(addr: number): boolean;
}
