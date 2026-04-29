import { CPU_CLOCK_RATE } from '../cpu';

export class Mixer {
  private static PULSE_LT = Array.from(
    { length: 31 },
    (_, i) => 95.52 / (8128 / i + 100)
  );

  private static TND_LT = Array.from(
    { length: 203 },
    (_, i) => 163.67 / (24329 / i + 100)
  );

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

  mix(p1: number, p2: number, t: number, n: number, d: number): void {
    this.samples[this.idx++] =
      Mixer.PULSE_LT[p1 + p2] + Mixer.TND_LT[3 * t + 2 * n + d];

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
