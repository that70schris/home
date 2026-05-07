import { ConfigMap, ConfigMapArgs } from '@pulumi/kubernetes/core/v1'
import { ResourceOptions } from '@pulumi/pulumi'

export class _ConfigMap extends ConfigMap {

  constructor(
    public name: string,
    args?: ConfigMapArgs,
    opts?: ResourceOptions,
  ) {
    super(name, {
      data: args?.data,
      metadata: {
        name,
      },
    }, opts)
  }

}
