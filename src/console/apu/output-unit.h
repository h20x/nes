#pragma once

class OutputUnit {
public:
  int get();

  void set(int v);

private:
  int n = 0;

  int sum = 0;

  int output = 0;
};
