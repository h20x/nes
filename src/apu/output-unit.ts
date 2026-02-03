export class OutputUnit {
  private n: number = 0;

  private sum: number = 0;

  private output: number = 0;

  get(): number {
    if (this.n > 0) {
      this.output = Math.round(this.sum / this.n);
      this.sum = this.n = 0;
    }

    return this.output;
  }

  set(v: number): void {
    ++this.n;
    this.sum += v;
  }
}
