#pragma once

#include <cstdint>

class Controller {
 public:
  uint8_t read();

  void pressButton(uint8_t btn);

  void releaseButton(uint8_t btn);

 private:
  uint8_t state = 0;

  uint8_t offset = 0;
};
