export COMMAND = $(word 1, $(MAKECMDGOALS))

$(COMMAND):
	-@kubectl config use-context berry
	-@pulumi stack select local
	@pulumi $(COMMAND)

cluster:
	curl -sfL https://get.k3s.io | sh - \
		--disable=traefik \
		--tls-san berry.local
