import { ApiKey, ApiKeyArgs } from '@pulumi/gcp/projects';
import { CustomResourceOptions } from '@pulumi/pulumi';
import { merge } from 'lodash';

import { Providers } from '../resources/providers';

export class _APIKey extends ApiKey {

  constructor(
    public $name,
    args: ApiKeyArgs,
    opts?: CustomResourceOptions,
    defaults = {
      displayName: $name,
    },
  ) {
    super($name,
      merge(defaults, args),
      merge(opts, {
        provider: Providers.operator,
        dependsOn: Providers.operator,
      }));
  }
}
