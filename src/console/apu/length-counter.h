#pragma once

#include <cstdint>

class LengthCounter {
public:
  void tick();

  bool isMuted();

  void setEnabled(bool v);

  void setHalt(bool v);

  void setValue(uint8_t v);

private:
  static constexpr uint8_t LT[32]{
      10, 254, 20, 2,  40, 4,  80, 6,  160, 8,  60, 10, 14, 12, 26, 14,
      12, 16,  24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30,
  };

  uint8_t value = 0;

  bool halt = false;

  bool enabled = false;
};
