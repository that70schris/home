export HOMEBREW_BUNDLE_FILE=~/Brewfile

_:
	@sudo true
	-softwareupdate --install-rosetta
	curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash
	brew bundle install
	@make init
	@make gh

gh:
	gh auth login \
	--git-protocol ssh \
	--hostname github.com \
	--clipboard \
	--web \

init:
	-git init
	-git remote add origin git@github.com:that70schris/-

# full disk access
fetch:
	git fetch
	git checkout main
	git submodules update --init --recursive

berry.local:
	@sudo true
	apt update
	apt upgrade -y
	apt install gh
	apt install zsh
	chsh -s $(which zsh)
	@make init
	@make gh
