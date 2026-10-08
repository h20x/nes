#include "mapper.h"

Mapper3::Mapper3(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize,
                 Mirroring mirroring, bool altNametableLayout)
    : Mapper(prg, prgSize, chr, chrSize, mirroring, altNametableLayout) {}

void Mapper3::cpuWrite(u16 addr, u8 val) {
  if (addr < 0x8000) {
    return Mapper::cpuWrite(addr, val);
  }

  chrBank[0] = (val & 0x03) * chrBankSize * 2;
  chrBank[1] = chrBank[0] + chrBankSize;
}
