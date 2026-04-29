export class FrameCounter {
  private value: number = 0;

  private mode: number = 0;

  private irq: boolean = false;

  private irqEnabled: boolean = false;

  tick(): number {
    this.value += 1;
    let q = 0;

    if (7458 === this.value || 22372 === this.value) {
      q = 1;
    } else if (14916 === this.value) {
      q = 2;
    } else if (29831 === this.value && this.mode === 0) {
      this.irq = this.irqEnabled;
    } else if (29832 === this.value && this.mode === 0) {
      q = 4;
      this.irq = this.irqEnabled;
    } else if (29833 === this.value && this.mode === 0) {
      this.value = 3;
      this.irq = this.irqEnabled;
    } else if (37284 === this.value) {
      q = 4;
      this.value = 2;
    }

    return q;
  }

  reset(): void {
    this.value = 0;
  }

  clearIRQ(): void {
    this.irq = false;
  }

  isIRQ(): boolean {
    return this.irq;
  }

  setMode(v: number): void {
    this.mode = v;
  }

  setInterruptInhibitFlag(v: number): void {
    this.irqEnabled = !v;

    if (v) {
      this.irq = false;
    }
  }
}
