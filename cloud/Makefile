export COMMAND = $(word 1, $(MAKECMDGOALS))

$(COMMAND):
	-@kubectl config use-context berry
	@pulumi $(COMMAND)
