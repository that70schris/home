_:
	@sudo true
	apt update
	apt upgrade -y
	apt install gh
	apt install zsh
	apt install kubecolor
	chsh -s $(which zsh)

	@make git
	@make gh
	@make rust
	@make starship

cluster:
	curl -sfL https://get.k3s.io | sh -s - \
		--disable=traefik \
		--tls-san=192.168.0.5 \
		--tls-san=berry.local \
		--tls-san=berry \

gh:
	gh auth login \
	--git-protocol ssh \
	--hostname github.com \
	--clipboard \
	--web \

git:
	-git init
	-git remote add origin git@github.com:that70schris/-

# full disk access
fetch:
	git fetch
	git checkout main
	git submodule update --init --recursive

rust:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

starship:
	@cd starship && cargo install --path .

up update:
	brew upgrade
	pnpm update
	git submodule update --init --remote
