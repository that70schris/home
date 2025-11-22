import { Repository, RepositoryArgs } from '@pulumi/gcp/artifactregistry';
import { CustomResourceOptions } from '@pulumi/pulumi';

interface _RepositoryArgs extends Omit<RepositoryArgs,
  | 'format'
  | ''> {

}

export class _Repository extends Repository {
  constructor(
    name: string,
    args?: _RepositoryArgs,
    options?: CustomResourceOptions,
  ) {
    super(name, {
      repositoryId: name,
      location: 'us',
      format: 'DOCKER',
      cleanupPolicies: [
        {
          id: 'keep',
          action: 'KEEP',
          mostRecentVersions: {
            keepCount: 10,
          },
        },
        {
          id: 'delete',
          action: 'DELETE',
          condition: {
            olderThan: `${30 * 24 * 60 * 60}s`,
          },
        },
      ],
      ...args,
    }, options);
  }
}
