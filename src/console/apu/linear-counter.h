#pragma once

#include <cstdint>

class LinearCounter {
public:
  void tick();

  bool isMuted();

  void setReloadFlag();

  void setReloadValue(uint8_t v);

  void setControlFlag(bool v);

private:
  uint8_t value = 0;

  uint8_t reloadValue = 0;

  bool controlFlag = 0;

  bool reloadFlag = 0;
};
