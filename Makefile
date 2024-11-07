.PHONY: all install test build
all: test build
install:
	pnpm i
build: install
	cd packages/minimxml && pnpm build
	cd packages/gml-3 && pnpm build
	cd packages/fes-2 && pnpm build
	cd packages/wfs-t-2 && pnpm build
test: build
	cd packages/minimxml && pnpm test -- --run
	cd packages/gml-3 && pnpm test -- --run
	cd packages/fes-2 && pnpm test -- --run
	cd packages/wfs-t-2 && pnpm test -- --run
