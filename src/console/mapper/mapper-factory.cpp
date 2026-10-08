#include "mapper-factory.h"
#include "mapper.h"
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <emscripten.h>
#include <emscripten/console.h>

Mapper *MapperFactory::create(uint8_t *arr) {
  if (arr[0] != 78 || arr[1] != 69 || arr[2] != 83 || arr[3] != 26) {
    throw "Invalid nes file";
  }

  uint32_t headerSize = 16;
  uint32_t prgSize = calcPrgSize(arr);
  uint32_t chrSize = calcChrSize(arr);
  Mapper::Mirroring mirroring = arr[6] & 0x01 ? Mapper::Mirroring::Vertical
                                              : Mapper::Mirroring::Horizontal;
  bool altNametableLayout = arr[6] & 0x08;
  bool trainer = (arr[6] & 0x04) != 0;
  uint32_t trainerSize = trainer ? 512 : 0;
  uint32_t mapperNum = ((arr[6] & 0xf0) >> 4) | (arr[7] & 0xf0);
  uint8_t *prg = arr + headerSize + trainerSize;
  uint8_t *chr = chrSize ? prg + prgSize : nullptr;

  switch (mapperNum) {
  case 0:
    return new Mapper0(prg, prgSize, chr, chrSize, mirroring,
                       altNametableLayout);

  case 1:
    return new Mapper1(prg, prgSize, chr, chrSize, mirroring,
                       altNametableLayout);

  case 2:
    return new Mapper2(prg, prgSize, chr, chrSize, mirroring,
                       altNametableLayout);

  case 3:
    return new Mapper3(prg, prgSize, chr, chrSize, mirroring,
                       altNametableLayout);

  case 4:
    return new Mapper4(prg, prgSize, chr, chrSize, mirroring,
                       altNametableLayout);

  case 7:
    return new Mapper7(prg, prgSize, chr, chrSize, mirroring,
                       altNametableLayout);

  default:
    char msg[32];
    std::snprintf(msg, sizeof(msg), "Unsupported mapper %d", mapperNum);
    emscripten_console_error(msg);
    EM_ASM({ alert(UTF8ToString($0)); }, msg);

    return nullptr;
  }
}

uint32_t MapperFactory::calcPrgSize(uint8_t *arr) {
  bool nes2format = (arr[7] & 0x0c) == 0x08;

  if (!nes2format) {
    return arr[4] * 16384;
  }

  uint32_t hi = arr[9] & 0x0f;

  if (hi < 0x0f) {
    return ((hi << 8) | arr[4]) * 16384;
  }

  uint32_t m = arr[4] & 0x03;
  uint32_t e = (arr[4] & 0xfc) >> 2;

  return pow(2, e) * (m * 2 + 1);
}

uint32_t MapperFactory::calcChrSize(uint8_t *arr) {
  bool nes2format = (arr[7] & 0x0c) == 0x08;

  if (!nes2format) {
    return arr[5] * 8192;
  }

  uint32_t hi = arr[9] & 0xf0;

  if (hi < 0x0f) {
    return ((hi << 4) | arr[5]) * 8192;
  }

  uint32_t m = arr[5] & 0x03;
  uint32_t e = (arr[5] & 0xfc) >> 2;

  return pow(2, e) * (m * 2 + 1);
}
