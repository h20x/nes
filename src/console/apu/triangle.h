#pragma once

#include "length-counter.h"
#include "linear-counter.h"
#include "output-unit.h"
#include <cstdint>

class Triangle {
public:
  void tick(uint8_t q);

  void register_(uint8_t reg, uint8_t val);

  uint8_t output();

  bool isEnabled();

  void setEnabled(bool v);

private:
  static constexpr uint8_t SEQ[32]{
      15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5,  4,  3,  2,  1,  0,
      0,  1,  2,  3,  4,  5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  };

  uint16_t period = 0;

  uint16_t periodCounter = 0;

  uint8_t sequencer = 0;

  LengthCounter lengthCounter;

  LinearCounter linearCounter;

  OutputUnit outputUnit;
};
