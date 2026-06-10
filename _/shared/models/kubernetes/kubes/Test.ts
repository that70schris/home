import { _Kube, _KubeSpec } from '../_Kube'

export class Test extends _Kube {
  // image = 'nginx'

  constructor(
    overrides: _KubeSpec = {
      container_port: 80,
      service_port: 80,
      image: 'nginx',
      gateway: true,
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
