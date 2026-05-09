import { _Kube } from '..'

export class Homey extends _Kube {
  override image = 'ghcr.io/athombv/homey-shs'
  override container_port = 4859
  override service_port = 443
  override ingress = true

  override get containerSecurityContext() {
    return {
      privileged: true,
    }
  }

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/home/chris/.config/homey',
      },
    }])
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      mountPath: '/homey/user',
      name: 'config',
    }])
  }

  override get environment() {
    return super.environment.concat([{
      name: 'HOMEY_LOCAL_ADDRESS',
      value: 'homey.bailey.mx',
    }])
  }

  override get index() {
    return [
      this.service,
    ]
  }

}
