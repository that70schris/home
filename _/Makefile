export COMMAND = $(word 1, $(MAKECMDGOALS))

$(COMMAND):
	-@kubecolor config use-context berry
	-@pulumi stack select local
	@pulumi $(COMMAND)
