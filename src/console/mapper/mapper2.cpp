#include "mapper.h"

Mapper2::Mapper2(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize,
                 Mirroring mirroring, bool altNametableLayout)
    : Mapper(prg, prgSize, chr, chrSize, mirroring, altNametableLayout) {}

void Mapper2::cpuWrite(u16 addr, u8 val) {
  if (addr < 0x8000) {
    return Mapper::cpuWrite(addr, val);
  }

  prgBank[0] = (val & 0x0f) * prgBankSize;
}
