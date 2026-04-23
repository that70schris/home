_:
	@sudo true
	@cd .. && make git
	@cd .. && make gh

	@cd .. && make fetch
	curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash
# 	-softwareupdate --install-rosetta
	brew bundle install --global
	kiro-cli integrations install input-method
