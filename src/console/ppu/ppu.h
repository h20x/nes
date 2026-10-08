#pragma once

#include "ppu-bus.h"
#include <cstdint>
#include <functional>

using u8 = uint8_t;
using u16 = uint16_t;

class PPU {
public:
  enum PPURegister {
    Ctrl,
    Mask,
    Status,
    OAMAddr,
    OAMData,
    Scroll,
    VRAMAddr,
    VRAMData,
  };

  static const u16 IMAGE_WIDTH = 256;

  PPU(PPUBus *bus, uint32_t *imageData);

  u8 oam[256]{};

  bool isNMI();

  u8 register_(PPURegister reg);

  void register_(PPURegister reg, u8 val);

  bool tick();

private:
  PPUBus *bus;

  uint32_t *imageData;

  const u8 RENDERING_TOGGLE_DELAY = 4;

  u16 cycle = 0;

  u16 scanline = 0;

  u8 readBuffer = 0;

  bool nmi = false;

  bool oddFrame = false;

  bool renderingEnabled = false;

  unsigned long long cyclesTotal = 0;

  unsigned long long renderingChangeCycle = 0;

  unsigned long long statusRegisterReadCycle = 0;

  unsigned long long vblFlagSetCycle = 0;

  u8 registers[8]{};

  u8 tile[3]{};

  u8 currSprites_[48]{};
  u8 *currSprites = currSprites_;

  u8 nextSprites_[48]{};
  u8 *nextSprites = nextSprites_;

  u8 currSpritesLen = 0;

  u8 nextSpritesLen = 0;

  uint32_t tileShifter = 0;

  uint32_t attrShifter = 0;

  u16 v = 0;

  u16 t = 0;

  u8 x = 0;

  bool w = false;

  void reloadShifters();

  void fetchBgTile();

  void drawPixel();

  void incHorPos();

  void incVerPos();

  void evaluateSprites();

  void fetchSprites();
};
