#include "mapper.h"
#include <cstdint>

Mapper7::Mapper7(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize,
                 Mirroring mirroring, bool altNametableLayout)
    : Mapper(prg, prgSize, chr, chrSize, mirroring, altNametableLayout) {}

void Mapper7::cpuWrite(uint16_t addr, uint8_t val) {
  if (addr < 0x8000) {
    return Mapper::cpuWrite(addr, val);
  }

  prgBank[0] = (val & 0x07) * prgBankSize * 2;
  prgBank[1] = prgBank[0] + prgBankSize;
  mirroring =
      val & 0x10 ? Mirroring::SingleScreenHi : Mirroring::SingleScreenLo;
}
