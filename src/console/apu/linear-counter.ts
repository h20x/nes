export class LinearCounter {
  private value: number = 0;

  private controlFlag: number = 0;

  private reloadFlag: number = 0;

  private reloadValue: number = 0;

  tick(): void {
    if (this.reloadFlag) {
      this.value = this.reloadValue;
      this.reloadFlag = this.controlFlag;
    } else if (this.value > 0) {
      --this.value;
    }
  }

  isMuted(): boolean {
    return this.value === 0;
  }

  setReloadFlag(): void {
    this.reloadFlag = 1;
  }

  setReloadValue(v: number): void {
    this.reloadValue = v;
  }

  setControlFlag(v: number): void {
    this.controlFlag = v;
  }
}
