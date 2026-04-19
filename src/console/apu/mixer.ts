import { CPU_CLOCK_RATE } from '../cpu';

export class Mixer {
  private len: number = 768;

  private idx: number = 0;

  private samples: Float32Array = new Float32Array(this.len);

  private ctx: AudioContext = new AudioContext({
    sampleRate: CPU_CLOCK_RATE / 41,
  });

  private node!: AudioWorkletNode;

  async init(): Promise<void> {
    await this.ctx.audioWorklet.addModule('audio-processor.js');
    this.node = new AudioWorkletNode(this.ctx, 'audio-processor');
    this.node.connect(this.ctx.destination);
  }

  mix(s1: number, s2: number, t: number, n: number, d: number): void {
    this.samples[this.idx++] =
      0.00752 * (s1 + s2) + 0.00851 * t + 0.00494 * n + 0.00335 * d;

    if (this.idx === this.len) {
      this.idx = 0;
      this.node.port.postMessage(this.samples, [this.samples.buffer]);
      this.samples = new Float32Array(this.len);
    }
  }

  reset(): void {
    this.idx = 0;
    this.samples = new Float32Array(this.len);
  }
}
