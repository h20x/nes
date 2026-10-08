#include "ppu.h"

#include <cstdint>

#include "palette.h"
#include "ppu-bus.h"

using u8 = uint8_t;
using u16 = uint16_t;

PPU::PPU(PPUBus *bus, uint32_t *imageData) : bus(bus), imageData(imageData) {}

bool PPU::isNMI() {
  bool f = nmi;
  nmi = false;

  return f;
}

u8 PPU::register_(PPURegister reg) {
  if (Status == reg) {
    u8 status = registers[reg];

    statusRegisterReadCycle = cyclesTotal;
    registers[reg] &= 0x7f;
    w = false;

    long long diff = cyclesTotal - vblFlagSetCycle;

    if (diff == 0 || diff == 1) {
      nmi = false;
    }

    return status;
  } else if (OAMData == reg) {
    return oam[registers[OAMAddr]];
  } else if (VRAMData == reg) {
    u8 val = bus->read(v);
    u8 buf = readBuffer;
    readBuffer = val;
    v += registers[Ctrl] & 0x04 ? 32 : 1;
    v &= 0x7fff;

    return buf;
  }

  return 0;
}

void PPU::register_(PPURegister reg, u8 val) {
  if (Ctrl == reg) {
    // enabling NMI when VBlank flag is set
    if ((registers[reg] ^ val) & 0x80 && val & registers[Status] & 0x80 &&
        cycle != 0) {
      nmi = true;
    }

    if (!(val & 0x80)) {
      nmi = false;
    }

    t &= ~0x0c00;
    t |= (val & 0x03) << 10;
    registers[reg] = val;
  } else if (Mask == reg) {
    bool re = val & 0x18;

    if (renderingEnabled != re) {
      renderingChangeCycle = cyclesTotal;
    }

    registers[reg] = val;
    renderingEnabled = re;
  } else if (OAMAddr == reg) {
    registers[reg] = val;
  } else if (OAMData == reg) {
    oam[registers[OAMAddr]++] = val;
  } else if (Scroll == reg) {
    if (w) {
      t &= ~0x73e0;
      t |= ((val & 0x07) << 12) | ((val & 0x38) << 2) | ((val & 0xc0) << 2);
    } else {
      t &= ~0x1f;
      t |= (val & 0xf8) >> 3;
      x = val & 0x07;
    }

    w = !w;
  } else if (VRAMAddr == reg) {
    if (w) {
      t &= 0xff00;
      t |= val;
      v = t;
    } else {
      t &= 0x00ff;
      t |= val << 8;
      t &= 0x3fff;
    }

    w = !w;
  } else if (VRAMData == reg) {
    bus->write(v, val);
    v += registers[Ctrl] & 0x04 ? 32 : 1;
    v &= 0x7fff;
  }
}

bool PPU::tick() {
  ++cyclesTotal;

  long long diff = cyclesTotal - renderingChangeCycle;
  bool renEnabled = (renderingEnabled && diff >= RENDERING_TOGGLE_DELAY) ||
                    (!renderingEnabled && diff < RENDERING_TOGGLE_DELAY);

  if (renEnabled && (239 >= scanline || 261 == scanline)) {
    if ((cycle >= 1 && 256 >= cycle) || (cycle >= 321 && 336 >= cycle)) {
      u8 r = cycle % 8;

      if (0 == r) {
        incHorPos();
      }

      if (1 == r) {
        reloadShifters();
        fetchBgTile();
      }

      if (cycle >= 1 && 256 >= cycle && 261 != scanline) {
        drawPixel();
      }

      tileShifter <<= 2;
      attrShifter <<= 2;
    }

    if (65 == cycle && 261 != scanline) {
      evaluateSprites();
    }

    if (256 == cycle) {
      incVerPos();
    }

    if (257 == cycle && 261 != scanline) {
      fetchSprites();
    }

    // copy horizontal position from t to v
    if (257 == cycle) {
      v &= ~0x041f;
      v |= t & 0x041f;
    }

    if (260 == cycle) {
      bus->scanline();
    }

    // copy vertical position from t to v
    if (280 == cycle && 261 == scanline) {
      v &= ~0x7be0;
      v |= t & 0x7be0;
    }
  }

  // draw a transparent pixel
  if (!renEnabled && cycle >= 1 && 256 >= cycle && 239 >= scanline) {
    imageData[scanline * IMAGE_WIDTH + cycle - 1] = PALETTE[bus->read(0x3f00)];
  }

  // set VBlank flag if $2002 wasn't read one PPU cycle ago
  if (241 == scanline && 0 == cycle &&
      cyclesTotal - statusRegisterReadCycle != 1) {
    vblFlagSetCycle = cyclesTotal;
    registers[Status] |= 0x80;

    if (registers[Ctrl] & 0x80) {
      nmi = true;
    }
  }

  // clear sprite overflow, sprite 0 hit, VBlank
  if (261 == scanline && 0 == cycle) {
    registers[Status] &= 0x1f;
    nmi = false;
  }

  if (340 == cycle) {
    cycle = 0;
    ++scanline;
  } else {
    ++cycle;
  }

  if (262 == scanline) {
    // skip 0 cycle
    if (oddFrame && renEnabled) {
      cycle = 1;
    }

    scanline = 0;
    oddFrame = !oddFrame;

    return true;
  }

  return false;
}

void PPU::reloadShifters() {
  u8 attr = tile[0];
  u8 lo = tile[1];
  u8 hi = tile[2];
  u8 x = ((v - 1) & 0x03) >> 1;
  u8 y = ((v >> 5) & 0x03) >> 1;
  u8 a = attr >> ((y << 2) | (x << 1));

  tileShifter |= ((hi & 0x80) << 8) | ((lo & 0x80) << 7) | ((hi & 0x40) << 7) |
                 ((lo & 0x40) << 6) | ((hi & 0x20) << 6) | ((lo & 0x20) << 5) |
                 ((hi & 0x10) << 5) | ((lo & 0x10) << 4) | ((hi & 0x08) << 4) |
                 ((lo & 0x08) << 3) | ((hi & 0x04) << 3) | ((lo & 0x04) << 2) |
                 ((hi & 0x02) << 2) | ((lo & 0x02) << 1) | ((hi & 0x01) << 1) |
                 ((lo & 0x01) << 0);

  attrShifter |= a & 0x01 && a & 0x02      ? 0xffff
                 : a & 0x01 && !(a & 0x02) ? 0x5555
                 : !(a & 0x01) && a & 0x02 ? 0xaaaa
                                           : 0;
}

void PPU::fetchBgTile() {
  // tile index
  u8 idx = bus->read(0x2000 | (v & 0x0fff));

  // tile attribute
  tile[0] =
      bus->read(0x23c0 | (v & 0x0c00) | ((v >> 4) & 0x38) | ((v >> 2) & 0x07));

  u16 addr = registers[Ctrl] & 0x10 ? 0x1000 : 0x0000;

  // tile low byte
  tile[1] = bus->read(addr | (idx << 4) | ((v & 0x7000) >> 12));

  // tile high byte
  tile[2] = bus->read(addr | (idx << 4) | ((v & 0x7000) >> 12) | 0x08);
}

void PPU::drawPixel() {
  u16 x = cycle - 1;
  u16 y = scanline;

  bool bgEnabled = registers[Mask] & 0x08 && (registers[Mask] & 0x02 || x > 7);
  bool sprEnabled = registers[Mask] & 0x10 && (registers[Mask] & 0x04 || x > 7);

  u8 paletteIndex = (attrShifter >> (30 - (this->x << 1))) & 0x03;
  u8 colorIndex = bgEnabled ? (tileShifter >> (30 - (this->x << 1))) & 0x03 : 0;

  for (u8 i = 0; sprEnabled && i < currSpritesLen; i += 6) {
    uint16_t xOffset = x - currSprites[i + 3];

    if (xOffset < 0 || xOffset > 7) {
      continue;
    }

    u8 lo = currSprites[i + 4];
    u8 hi = currSprites[i + 5];
    bool hFlip = currSprites[i + 2] & 0x40;
    u8 offset = hFlip ? xOffset : 0x07 ^ xOffset;
    u8 colIndex = ((lo >> offset) & 0x01) | (((hi >> offset) & 0x01) << 1);

    if (0 == colIndex) {
      continue;
    }

    // sprite 0 hit
    if (0 == i && 0 != colorIndex && cycle < 256 && currSprites[0] == oam[0] &&
        currSprites[3] == oam[3]) {
      registers[Status] |= 0x40;
    }

    u8 priority = currSprites[i + 2] & 0x20;

    if (0 == colorIndex || (0 == priority && 0 != colIndex)) {
      paletteIndex = 0x04 | (currSprites[i + 2] & 0x03);
      colorIndex = colIndex;
    }

    break;
  }

  u8 color = bus->read(0x3f00 | (paletteIndex << 2) | colorIndex);

  if (registers[Mask] & 0x01) {
    color &= 0x30;
  }

  imageData[y * IMAGE_WIDTH + x] = PALETTE[color];
}

void PPU::incHorPos() {
  if (31 == (v & 0x001f)) {
    v &= ~0x001f;
    v ^= 0x0400;
  } else {
    ++v;
  }
}

void PPU::incVerPos() {
  if ((v & 0x7000) != 0x7000) {
    v += 0x1000;
  } else {
    v &= ~0x7000;
    u8 y = (v & 0x03e0) >> 5;

    if (29 == y) {
      y = 0;
      v ^= 0x0800;
    } else if (31 == y) {
      y = 0;
    } else {
      ++y;
    }

    v = (v & ~0x03e0) | (y << 5);
  }
}

void PPU::evaluateSprites() {
  u8 height = registers[Ctrl] & 0x20 ? 16 : 8;
  u8 l = 0;

  for (u16 i = 0; i < 256; i += 4) {
    if (scanline < oam[i] || scanline >= oam[i] + height) {
      continue;
    }

    // sprite overflow
    if (l == 48) {
      registers[Status] |= 0x20;

      break;
    }

    nextSprites[l] = oam[i];
    nextSprites[l + 1] = oam[i + 1];
    nextSprites[l + 2] = oam[i + 2];
    nextSprites[l + 3] = oam[i + 3];

    l += 6;
  }

  nextSpritesLen = l;
}

void PPU::fetchSprites() {
  // 8x16
  if (registers[Ctrl] & 0x20) {
    for (u8 i = 0; i < nextSpritesLen; i += 6) {
      bool vFlip = nextSprites[i + 2] & 0x80;
      u16 yOffset = scanline - nextSprites[i];
      u8 offset = yOffset % 8;
      u8 tileNum = yOffset >> 3;

      if (vFlip) {
        offset ^= 0x07;
        tileNum = (tileNum + 1) % 2;
      }

      u16 addr = nextSprites[i + 1] & 0x01 ? 0x1000 : 0x0000;
      addr |= (nextSprites[i + 1] & 0xfe) << 4;

      if (1 == tileNum) {
        addr |= 0x10;
      }

      nextSprites[i + 4] = bus->read(addr | offset);
      nextSprites[i + 5] = bus->read(addr | offset | 0x08);
    }
  }
  // 8x8
  else {
    u16 addr = registers[Ctrl] & 0x08 ? 0x1000 : 0x0000;

    for (u8 i = 0; i < nextSpritesLen; i += 6) {
      bool vFlip = nextSprites[i + 2] & 0x80;
      u16 yOffset = scanline - nextSprites[i];
      u16 offset = vFlip ? 0x07 ^ yOffset : yOffset;

      nextSprites[i + 4] = bus->read(addr | (nextSprites[i + 1] << 4) | offset);
      nextSprites[i + 5] =
          bus->read(addr | (nextSprites[i + 1] << 4) | offset | 0x08);
    }
  }

  u8 *t = currSprites;
  currSprites = nextSprites;
  nextSprites = t;
  currSpritesLen = nextSpritesLen;
  nextSpritesLen = 0;
}
