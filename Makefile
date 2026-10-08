OUTDIR = ./build
SRCFILES = $(shell find ./src -name "*.cpp")
OBJFILES = $(SRCFILES:%.cpp=$(OUTDIR)/%.o)
O = -O3
FLAGS = $(O) -sMODULARIZE -sAUDIO_WORKLET -sWASM_WORKERS -flto -sEXPORTED_FUNCTIONS=_malloc,_free -sEXPORTED_RUNTIME_METHODS=HEAPU8
TFLAGS = -O3 -sMODULARIZE -sALLOW_TABLE_GROWTH=1 -sEXPORTED_FUNCTIONS=_malloc,_free -sEXPORTED_RUNTIME_METHODS=addFunction,getValue,HEAPU16

all: $(OBJFILES)
	em++ $^ -o ./dist/main.js $(FLAGS)

$(OUTDIR)/%.o: %.cpp
	mkdir -p $(dir $@)
	em++ -c $< -o $@ $(O)

tests: ./tests/main.cpp ./src/console/cpu/cpu.cpp
	mkdir -p $(dir $(OUTDIR)/$<)
	em++ $^ -o $(OUTDIR)/tests/main.js $(TFLAGS)

clean:
	rm -r ./build/*

.PHONY: all tests clean