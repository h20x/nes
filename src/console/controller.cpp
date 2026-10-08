#include "controller.h"
#include <cstdint>

uint8_t Controller::read() {
  uint8_t val = ((state >> offset++) & 0x01) | 0x40;
  offset %= 8;

  return val;
}

void Controller::pressButton(uint8_t btn) { state |= btn; }

void Controller::releaseButton(uint8_t btn) { state &= ~btn; }
