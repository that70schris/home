_:
	@sudo true
	-softwareupdate --install-rosetta
	curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash
	brew bundle install --global
	kiro-cli integrations install input-method
	@cd .. && make git
	@cd .. && make gh
