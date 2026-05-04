_:
	@sudo true
	@cd .. && make git
	@cd .. && make gh

	@cd .. && make fetch
	@make brew
	kiro-cli integrations install input-method
	@cd .. && make starship

brew:
	curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash
	brew bundle install --global
