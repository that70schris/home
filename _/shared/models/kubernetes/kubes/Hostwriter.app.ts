import { Resource } from '@pulumi/pulumi'
import { _Kube } from '../_Kube'

export class Host_Writer extends _Kube {
  override image = 'ghcr.io/linuxserver/host-writer:latest'

  override get index(): Resource[] {
    return [
      this.service,
    ]
  }
}
