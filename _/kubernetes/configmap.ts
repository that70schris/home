import { ConfigMap } from '@pulumi/kubernetes/core/v1';

export class _ConfigMap extends ConfigMap {

  constructor(
    public name: string,
    data,
    opts?,
  ) {
    super(name, {
      metadata: {
        name,
      },
      data,
    }, opts);
  }

}
