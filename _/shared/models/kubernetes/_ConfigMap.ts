import { ConfigMap, ConfigMapArgs } from '@pulumi/kubernetes/core/v1'
import { ResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'

export class _ConfigMap extends ConfigMap {

  constructor(
    public name: string,
    args?: ConfigMapArgs,
    opts?: ResourceOptions,
  ) {
    super(name,
      merge(args, {
        metadata: {
          name,
        },
      }),
      opts)
  }

}
