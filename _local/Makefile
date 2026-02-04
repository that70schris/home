export COMMAND = $(word 1, $(MAKECMDGOALS))

$(COMMAND):
	-@kubectl config use-context berry
	-@pulumi stack select local
	@pulumi $(COMMAND)

# gcloud auth configure-docker us-docker.pkg.dev --quiet
import export:
	@pulumi stack $(word 2, $(MAKECMDGOALS)) --file=./exports/$(ENVIRONMENT).json

job:
	kubectl create job --from=cronjob/$(CRONJOB) $(CRONJOB)-manual-$(shell date +%s)
