#pragma once

#include "envelope.h"
#include "length-counter.h"
#include "output-unit.h"
#include <cstdint>

class Noise {
public:
  void tick(uint8_t q, bool even = false);

  void register_(uint8_t reg, uint8_t val);

  uint8_t output();

  bool isEnabled();

  void setEnabled(bool v);

private:
  static constexpr uint16_t LT[]{
      2, 4, 8, 16, 32, 48, 64, 80, 101, 127, 190, 254, 381, 508, 1017, 2034,
  };

  uint8_t shift = 6;

  uint16_t period = 0;

  uint16_t periodCounter = 0;

  uint16_t shifter = 1;

  Envelope envelope;

  LengthCounter counter;

  OutputUnit outputUnit;
};
