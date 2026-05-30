cluster:
  sudo cp k3s.yaml /etc/rancher/k3s/config.yaml
	curl -sfL https://get.k3s.io | sh -s -

up update:
	git submodule update --init --remote
	brew upgrade
	pnpm update
