#include "apu/apu.h"
#include "console.h"
#include <cstdint>
#include <emscripten/em_macros.h>

static Console *console = nullptr;

static APU apu;

extern "C" {
EMSCRIPTEN_KEEPALIVE
void init(uint8_t *gameData, uint32_t *imageData) {
  delete console;
  console = new Console(gameData, imageData, &apu);
  console->init();
}

EMSCRIPTEN_KEEPALIVE
void renderFrame() {
  if (console) {
    console->renderFrame();
  }
}

EMSCRIPTEN_KEEPALIVE
void pressButton(uint8_t btn) {
  if (console) {
    console->pressButton(btn);
  }
}

EMSCRIPTEN_KEEPALIVE
void releaseButton(uint8_t btn) {
  if (console) {
    console->releaseButton(btn);
  }
}
}