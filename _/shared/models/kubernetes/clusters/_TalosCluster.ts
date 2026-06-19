import { Namespace } from '@pulumi/kubernetes/core/v1'
import { ResourceOptions } from '@pulumi/pulumi'
import { _Cluster, ClusterArgs } from '../_Cluster'

export class _TalosCluster extends _Cluster {

  constructor(
    public name: string,
    public args: ClusterArgs,
    public opts?: ResourceOptions,
  ) {
    super(name, args, opts)

    new Namespace('default', {
      metadata: {
        name: 'default',
        labels: {
          'pod-security.kubernetes.io/enforce': 'privileged',
          'pod-security.kubernetes.io/audit': 'restricted',
          'pod-security.kubernetes.io/warn': 'baseline',
        },
      },
    }, {
      retainOnDelete: true,
      import: 'default',
    })
  }

}
