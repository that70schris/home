export HOMEBREW_BUNDLE_FILE=~/Brewfile

_:
	@sudo true
	-softwareupdate --install-rosetta
	@make brew
	@make git

brew:
	@sudo true
	curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash
	-brew bundle install

git:
	-git init
	-git remote add origin https://github.com/that70schris/-
	gh auth login -p https -h github.com
	git fetch
	# grant full disk access
	git checkout main
	git fetch --recurse-submodules --prune

berry.local:
	@sudo true
	apt update
	apt upgrade -y
	apt install zsh
	chsh -s $(which zsh)
