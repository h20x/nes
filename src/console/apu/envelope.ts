export class Envelope {
  private period: number = 0;

  private periodCounter: number = 0;

  private decayCounter: number = 0;

  private volume: number = 0;

  private start: number = 0;

  private loop: number = 0;

  private constVolumeMode: number = 0;

  tick(): void {
    if (this.start) {
      this.start = 0;
      this.decayCounter = 15;
      this.periodCounter = this.period;

      return;
    }

    if (this.periodCounter > 0) {
      --this.periodCounter;

      return;
    }

    this.periodCounter = this.period;

    if (this.decayCounter === 0) {
      this.loop && (this.decayCounter = 15);
    } else {
      --this.decayCounter;
    }
  }

  getVolume(): number {
    return this.constVolumeMode ? this.volume : this.decayCounter;
  }

  setLoop(v: number): void {
    this.loop = v;
  }

  setStartFlag(): void {
    this.start = 1;
  }

  setConstVolumeMode(v: number): void {
    this.constVolumeMode = v;
  }

  setVolume(v: number): void {
    this.constVolumeMode ? (this.volume = v) : (this.period = v);
  }
}
