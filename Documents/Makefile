_:
	@sudo true
	@cd .. && make git
	@cd .. && make gh

	@cd .. && make fetch
	curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash
	brew bundle install --global
	@cd .. && cargo build --release
	@cd .. && cargo install --path .
	kiro-cli integrations install input-method
