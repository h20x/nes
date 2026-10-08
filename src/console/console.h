#pragma once

#include "apu/apu.h"
#include "controller.h"
#include "cpu/cpu-bus.h"
#include "cpu/cpu.h"
#include "mapper/mapper.h"
#include "ppu/ppu-bus.h"
#include "ppu/ppu.h"
#include <cstdint>
#include <functional>

class Console {
public:
  Console(uint8_t *gameData, uint32_t *imageData, APU *apu);

  ~Console();

  void init();

  void renderFrame();

  void pressButton(uint8_t btn);

  void releaseButton(uint8_t btn);

  void setChannels(uint8_t ch);

private:
  APU *apu;

  CPUBus *cpuBus;

  CPU *cpu;

  PPUBus *ppuBus;

  PPU *ppu;

  Mapper *mapper;

  Controller *controller1;

  Controller *controller2;

  uint8_t *gameData;

  uint32_t *imageData;
};