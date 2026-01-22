import { Resource } from '@pulumi/pulumi'
import { _Kube } from '../_Kube'

export class mDNS extends _Kube {
  override image = 'blakec/external-mdns:latest'

  override get securityContext() {
    return {
      runAsUser: 65534,
      runAsGroup: 65534,
      runAsNonRoot: true,
    }
  }

  override get containerSecurityContext() {
    return {
      readOnlyRootFilesystem: true,
      allowPrivilegeEscalation: false,
      capabilities: {
        drop: ['ALL'],
      },
    }
  }

  override get args() {
    return [
      '-source=ingress',
      '-source=service',
    ]
  }

  override get index(): Resource[] {
    return super.index.concat([
      this.crb,
    ])
  }
}
