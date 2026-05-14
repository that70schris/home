#/bin/bash
apt update
apt upgrade -y
apt install gh
apt install zsh
apt install kubecolor
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
chsh -s $(which zsh)

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

cargo install --path ./starship
npm install
