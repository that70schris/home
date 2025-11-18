export COMMAND = $(word 1, $(MAKECMDGOALS))

_:
	-@pulumi stack select local
	-@kubectl config use-context berry

$(COMMAND): _
	@pulumi $(COMMAND)
