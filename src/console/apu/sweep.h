#pragma once

#include <cstdint>

class Sweep {
public:
  Sweep(bool ch1 = false);

  void tick();

  bool isEnabled();

  bool isMuted();

  uint16_t getPulsePeriod();

  void setEnabled(bool v);

  void setPeriod(uint8_t v);

  void setNegate(bool v);

  void setShift(uint8_t v);

  void setReloadFlag();

  void setPulsePeriod(uint16_t v);

private:
  uint8_t n;

  uint8_t period = 0;

  uint8_t periodCounter = 0;

  uint8_t shift = 0;

  uint16_t pulsePeriod = 0;

  uint16_t pulseTargetPeriod = 0;

  bool enabled = false;

  bool negate = false;

  bool reload = false;

  void updatePulseTargetPeriod();
};
