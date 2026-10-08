#include "output-unit.h"

int OutputUnit::get() {
  if (n > 0) {
    output = (double)sum / n + 0.5;
    sum = n = 0;
  }

  return output;
}

void OutputUnit::set(int v) {
  ++n;
  sum += v;
}
