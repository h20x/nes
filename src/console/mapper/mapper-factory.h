#include "mapper.h"
#include <cstdint>

class MapperFactory {
public:
  static Mapper *create(uint8_t *arr);

private:
  static uint32_t calcPrgSize(uint8_t *arr);

  static uint32_t calcChrSize(uint8_t *arr);
};