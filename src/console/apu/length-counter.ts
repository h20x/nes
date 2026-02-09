export class LengthCounter {
  private static LT = [
    10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14, 12, 16, 24,
    18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30,
  ];

  private value: number = 0;

  private halt: number = 0;

  private enabled: number = 0;

  tick(): void {
    if (!this.halt && this.value > 0) {
      --this.value;
    }
  }

  isMuted(): boolean {
    return this.value === 0;
  }

  setEnabled(v: number): void {
    this.enabled = v;

    if (!v) {
      this.value = 0;
    }
  }

  setHalt(v: number): void {
    this.halt = v;
  }

  setValue(v: number): void {
    if (this.enabled) {
      this.value = LengthCounter.LT[v];
    }
  }
}
