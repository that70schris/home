import { core } from '@pulumi/kubernetes/types/input'
import { _Kube, KubeOverrides } from '../_Kube'

export class Test extends _Kube {

  constructor(
    overrides: KubeOverrides = {
      container_port: 80,
      service_port: 80,
      image: 'nginx',
      gateway: true,
    },
  ) {
    super(overrides)
  }

  override get environment(): core.v1.EnvVar[] {
    return super.environment.concat([
      {
        name: 'NGINX_PORT',
        value: `${this.container_port}`,
      },
    ])
  }

  override get index() {
    return [
      this.service,
    ]
  }
}
