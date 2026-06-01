cluster:
	sudo cp k1s.config.yml /etc/rancher/kubesolo/config.yaml
	curl -sfL https://get.kubesolo.io | sh -s -

up update:
	git submodule update --init --remote
	brew upgrade
	pnpm update
