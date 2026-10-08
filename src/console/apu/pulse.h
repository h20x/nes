#pragma once

#include "envelope.h"
#include "length-counter.h"
#include "output-unit.h"
#include "sweep.h"
#include <cstdint>

class Pulse {
public:
  Pulse(bool ch1 = false);

  void tick(uint8_t q, bool even = false);

  void register_(uint8_t reg, uint8_t val);

  uint8_t output();

  bool isEnabled();

  void setEnabled(bool v);

private:
  static constexpr uint8_t LT[4][8]{
      {0, 1, 0, 0, 0, 0, 0, 0},
      {0, 1, 1, 0, 0, 0, 0, 0},
      {0, 1, 1, 1, 1, 0, 0, 0},
      {1, 0, 0, 1, 1, 1, 1, 1},
  };

  uint16_t period = 0;

  uint16_t periodCounter = 0;

  uint8_t sequencer = 0;

  uint8_t dutySeq = 0;

  Envelope envelope;

  LengthCounter counter;

  OutputUnit outputUnit;

  Sweep sweep;
};
