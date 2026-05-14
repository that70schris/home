cluster:
	curl -sfL https://get.k3s.io | sh -s - \
		--disable=traefik \
		--tls-san=192.168.0.5 \
		--tls-san=berry.local \
		--tls-san=berry \

up update:
	git submodule update --init --remote
	brew upgrade
	pnpm update
