install:
	pnpm install

build.client:
	npx vite build

build.preview:
	npx vite build --ssr src/entry.preview.tsx

build.server:
	npx vite build -c adapters/static/vite.config.ts

build:
	@make build.client
	@make build.server

dev:
	npx vite --mode ssr

dev.debug:
	npx node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force

preview:
	npx qwik build preview && vite preview --open

qwik:
	npx qwik

serve:
	npx qwik build && firebase emulators:start

start:
	npx vite --open --mode ss
