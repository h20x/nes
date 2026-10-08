#pragma once

#include <cstdint>

class Envelope {
public:
  void tick();

  uint8_t getVolume();

  void setLoop(bool v);

  void setStartFlag();

  void setConstVolumeMode(bool v);

  void setVolume(uint8_t v);

private:
  uint8_t period = 0;

  uint8_t periodCounter = 0;

  uint8_t decayCounter = 0;

  uint8_t volume = 0;

  bool start = false;

  bool loop = false;

  bool constVolumeMode = false;
};
