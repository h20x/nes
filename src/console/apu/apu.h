#pragma once

#include "../bus.h"
#include "dmc.h"
#include "frame-counter.h"
#include "mixer.h"
#include "noise.h"
#include "pulse.h"
#include "triangle.h"
#include <cstdint>

class APU {
public:
  enum APURegister {
    Pulse10,
    Pulse11,
    Pulse12,
    Pulse13,

    Pulse20,
    Pulse21,
    Pulse22,
    Pulse23,

    Triangle0,
    Triangle1,
    Triangle2,
    Triangle3,

    Noise0,
    Noise1,
    Noise2,
    Noise3,

    DMC0,
    DMC1,
    DMC2,
    DMC3,

    Status = 0x15,
    FrameCounterReg = 0x17,
  };

  APU();

  void init();

  void tick();

  uint8_t register_(APURegister reg);

  void register_(APURegister reg, uint8_t val);

  void reset();

  bool isIRQ();

  bool isInited();

  void setBus(Bus *busPtr);

private:
  unsigned long long cycles = 0;

  FrameCounter frameCounter;

  Pulse pulse1;

  Pulse pulse2;

  Triangle triangle;

  Noise noise;

  DMC dmc;

  Mixer mixer;
};
