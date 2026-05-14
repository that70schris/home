#/bin/bash
export NONINTERACTIVE=1
# xcode-select --install
curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash

make brew
brew install git
brew install gh

git init
git remote add origin git@github.com:that70schris/-
gh auth status || \
gh auth login \
	--git-protocol ssh \
	--hostname github.com \
	--clipboard \
	--web \

git fetch
git checkout main --force
git submodule update --init --recursive

brew bundle install --global
kiro-cli integrations install input-method
make shipstar
npm install
