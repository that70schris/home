_:
	@sudo true
	apt update
	apt upgrade -y
	apt install gh
	apt install zsh
	apt install kubecolor
	chsh -s $(which zsh)

	@make gh
	@make git
	@make rust
	@make starship

cluster:
	curl -sfL https://get.k3s.io | sh -s - \
		--disable=traefik \
		--tls-san=192.168.0.5 \
		--tls-san=berry.local \
		--tls-san=berry \

rust:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

shipstar:
	cargo install --path ./starship

up update:
	brew upgrade
	pnpm update
	git submodule update --init --remote
