#include "./mixer.h"
#include "../cpu/cpu.h"
#include <cstdint>
#include <emscripten/console.h>
#include <emscripten/webaudio.h>

class AudioBuffer {
public:
  AudioBuffer() {}

  void push(float v) {
    if (len < size) {
      data[(i + len++) % size] = v;
    }
  }

  void drain(float *output, int outputSize) {
    for (int j = 0; j < outputSize; ++j) {
      if (len > 0) {
        --len;
        v = data[i++];
        i %= size;
      }

      output[j] = v;
    }
  }

  void clear() { v = i = len = 0; }

private:
  static constexpr int size = 4096;

  float data[size]{};

  float v = 0;

  int i = 0;

  int len = 0;
};

static AudioBuffer buf;

static uint8_t audioThreadStack[4096];

static bool inited = false;

static bool initing = false;

bool processAudio(int numInputs, const AudioSampleFrame *inputs, int numOutputs,
                  AudioSampleFrame *outputs, int numParams,
                  const AudioParamFrame *params, void *userData) {
  buf.drain(outputs[0].data, outputs[0].samplesPerChannel);

  return true;
}

void mixerInited(const char *errMsg = nullptr) {
  inited = true;
  initing = false;

  if (errMsg) {
    emscripten_console_error(errMsg);
  }
}

void audioWorkletProcessorCreated(EMSCRIPTEN_WEBAUDIO_T audioContext,
                                  bool success, void *userData) {
  if (!success) {
    return mixerInited("Failed to create audio worklet processor");
  }

  int outputChannelCounts[1] = {1};
  EmscriptenAudioWorkletNodeCreateOptions options = {.numberOfInputs = 0,
                                                     .numberOfOutputs = 1,
                                                     .outputChannelCounts =
                                                         outputChannelCounts};

  EMSCRIPTEN_WEBAUDIO_T wasmAudioWorklet =
      emscripten_create_wasm_audio_worklet_node(audioContext, "audio-processor",
                                                &options, &processAudio, 0);

  emscripten_audio_node_connect(wasmAudioWorklet, audioContext, 0, 0);
  mixerInited();
}

void audioThreadInitialized(EMSCRIPTEN_WEBAUDIO_T audioContext, bool success,
                            void *userData) {
  if (!success) {
    return mixerInited("Failed to create audio worklet thread");
  }

  WebAudioWorkletProcessorCreateOptions opts = {
      .name = "audio-processor",
  };

  emscripten_create_wasm_audio_worklet_processor_async(
      audioContext, &opts, &audioWorkletProcessorCreated, 0);
}

void Mixer::init() {
  if (initing || inited) {
    return;
  }

  initing = true;

  EmscriptenWebAudioCreateAttributes attrs = {0};
  attrs.sampleRate = CPU::CLOCK_RATE / 41;
  EMSCRIPTEN_WEBAUDIO_T context = emscripten_create_audio_context(&attrs);

  if (!context) {
    return mixerInited("Failed to create audio context");
  }

  emscripten_start_wasm_audio_worklet_thread_async(context, audioThreadStack,
                                                   sizeof(audioThreadStack),
                                                   &audioThreadInitialized, 0);
}

void Mixer::mix(uint8_t p1, uint8_t p2, uint8_t t, uint8_t n, uint8_t d) {
  buf.push(PULSE_LT[p1 + p2] + TND_LT[3 * t + 2 * n + d]);
}

void Mixer::reset() { buf.clear(); }

bool Mixer::isInited() { return inited; }