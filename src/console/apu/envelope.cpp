#include "envelope.h"
#include <cstdint>

void Envelope::tick() {
  if (start) {
    start = false;
    decayCounter = 15;
    periodCounter = period;

    return;
  }

  if (periodCounter > 0) {
    --periodCounter;

    return;
  }

  periodCounter = period;

  if (decayCounter == 0) {
    loop && (decayCounter = 15);
  } else {
    --decayCounter;
  }
}

uint8_t Envelope::getVolume() {
  return constVolumeMode ? volume : decayCounter;
}

void Envelope::setLoop(bool v) { loop = v; }

void Envelope::setStartFlag() { start = true; }

void Envelope::setConstVolumeMode(bool v) { constVolumeMode = v; }

void Envelope::setVolume(uint8_t v) {
  constVolumeMode ? (volume = v) : (period = v);
}
