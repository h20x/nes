#include "mapper.h"

Mapper0::Mapper0(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize,
                 Mirroring mirroring, bool altNametableLayout)
    : Mapper(prg, prgSize, chr, chrSize, mirroring, altNametableLayout) {}
