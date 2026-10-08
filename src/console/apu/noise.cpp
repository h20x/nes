#include "noise.h"
#include <cstdint>

void Noise::tick(uint8_t q, bool even) {
  if (q > 0) {
    envelope.tick();
  }

  if (q > 1) {
    counter.tick();
  }

  if (!even) {
    return;
  }

  if (periodCounter == 0) {
    outputUnit.set(counter.isMuted() || shifter & 0x01 ? 0
                                                       : envelope.getVolume());

    uint8_t b = (shifter >> shift) & 0x01;
    shifter = (shifter >> 1) | (((shifter & 0x01) ^ b) << 14);
    periodCounter = period;
  } else {
    --periodCounter;
  }
}

void Noise::register_(uint8_t reg, uint8_t val) {
  if (0 == reg) {
    counter.setHalt(val & 0x20);
    envelope.setLoop(val & 0x20);
    envelope.setConstVolumeMode(val & 0x10);
    envelope.setVolume(val & 0x0f);
  } else if (2 == reg) {
    shift = val & 0x80 ? 6 : 1;
    period = LT[val & 0x0f];
  } else if (3 == reg) {
    counter.setValue((val >> 3) & 0x1f);
    envelope.setStartFlag();
  }
}

uint8_t Noise::output() { return outputUnit.get(); }

bool Noise::isEnabled() { return !counter.isMuted(); }

void Noise::setEnabled(bool v) { counter.setEnabled(v); }
