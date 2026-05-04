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

berry.local:
	@sudo true
	apt update
	apt upgrade -y
	apt install gh
	apt install zsh
	chsh -s $(which zsh)
	@make git
	@make gh
# 	curl -sS https://starship.rs/install.sh | sh
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	@cd ../starship && cargo install --path .

cluster:
	curl -sfL https://get.k3s.io | sh -s - \
		--tls-san=berry.local \
		--disable=traefik \
