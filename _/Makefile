export COMMAND = $(word 1, $(MAKECMDGOALS))

$(COMMAND):
	-@kubectl config use-context berry
	-@pulumi stack select local
	@pulumi $(COMMAND)

cluster:
	curl -sfL https://get.k3s.io | sh - \
		--tls-san berry.local \
		--disable=traefik \
