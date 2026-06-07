import { _Kube, KubeOverrides } from '../_Kube'

export class Test extends _Kube {

  constructor(
    overrides: KubeOverrides = {
      container_port: 8080,
      service_port: 80,
      image: 'nginx',
      ingress: true,
    },
  ) {
    super(overrides)
  }

  override get index() {
    return [
      this.service,
    ]
  }
}
