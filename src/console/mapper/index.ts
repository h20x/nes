import { Mapper, Mirroring } from './mapper';
import { Mapper0 } from './mapper0';
import { Mapper1 } from './mapper1';
import { Mapper2 } from './mapper2';
import { Mapper3 } from './mapper3';
import { Mapper4 } from './mapper4';
import { Mapper7 } from './mapper7';

export { Mapper } from './mapper';

export function createMapper(buffer: ArrayBuffer): Mapper {
  const arr = new Uint8Array(buffer, 0, buffer.byteLength);

  if (`${arr[0]}${arr[1]}${arr[2]}${arr[3]}` !== '78698326') {
    throw new Error('Error: invalid nes file');
  }

  const headerSize = 16;
  const prgSize = calcPrgSize(arr);
  const chrSize = calcChrSize(arr);
  const mirroring = arr[6] & 0x01 ? Mirroring.Vertical : Mirroring.Horizontal;
  const altNametableLayout = arr[6] & 0x08;
  const trainer = (arr[6] & 0x04) !== 0;
  const trainerSize = trainer ? 512 : 0;
  const mapperNum = ((arr[6] & 0xf0) >> 4) | (arr[7] & 0xf0);
  const prgStart = headerSize + trainerSize;
  const prgEnd = prgStart + prgSize;
  const prg = arr.slice(prgStart, prgEnd);
  const chr = chrSize
    ? arr.slice(prgEnd, prgEnd + chrSize)
    : new Uint8Array(8192);

  switch (mapperNum) {
    case 0:
      return new Mapper0(prg, chr, mirroring, altNametableLayout);

    case 1:
      return new Mapper1(prg, chr, mirroring, altNametableLayout);

    case 2:
      return new Mapper2(prg, chr, mirroring, altNametableLayout);

    case 3:
      return new Mapper3(prg, chr, mirroring, altNametableLayout);

    case 4:
      return new Mapper4(prg, chr, mirroring, altNametableLayout);

    case 7:
      return new Mapper7(prg, chr, mirroring, altNametableLayout);

    default:
      throw new Error(`Error: unsupported mapper "${mapperNum}"`);
  }
}

function calcPrgSize(arr: Uint8Array): number {
  const nes2format = (arr[7] & 0x0c) === 0x08;

  if (!nes2format) {
    return arr[4] * 16384;
  }

  const hi = arr[9] & 0x0f;

  if (hi < 0x0f) {
    return ((hi << 8) | arr[4]) * 16384;
  }

  const m = arr[4] & 0x03;
  const e = (arr[4] & 0xfc) >> 2;

  return 2 ** e * (m * 2 + 1);
}

function calcChrSize(arr: Uint8Array): number {
  const nes2format = (arr[7] & 0x0c) === 0x08;

  if (!nes2format) {
    return arr[5] * 8192;
  }

  const hi = arr[9] & 0xf0;

  if (hi < 0x0f) {
    return ((hi << 4) | arr[5]) * 8192;
  }

  const m = arr[5] & 0x03;
  const e = (arr[5] & 0xfc) >> 2;

  return 2 ** e * (m * 2 + 1);
}
