import { Deployment } from '@pulumi/kubernetes/apps/v1'
import { Service, ServiceAccount, ServiceSpecType } from '@pulumi/kubernetes/core/v1'
import { ClusterRole, ClusterRoleBinding } from '@pulumi/kubernetes/rbac/v1'
import { input } from '@pulumi/kubernetes/types'
import { Resource } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _IngressBackend, _Port } from '.'
import { once } from '../shared/decorators'

interface KubeOverrides {
  domain?: string
  name?: string
}

export class _Kube {
  name = this.constructor.name.toLowerCase()
  image: string = this.name
  container_port?: number
  service_port?: number
  path = '/'
  replicas = 1
  ingress: boolean = false
  domain?: string

  constructor(
    public overrides: KubeOverrides = {

    },
  ) {
    merge(
      this,
      overrides,
    )
  }

  get metadata(): input.meta.v1.ObjectMeta {
    return {
      name: this.name,
      labels: {
        app: this.name,
      },
    }
  }

  get http_check(): input.core.v1.HTTPGetAction {
    return {
      path: this.path,
      port: this.port.numbers.container,
    }
  }

  @once
  get port(): _Port | undefined {
    return this.container_port && new _Port('main', {
      container: this.container_port,
      service: this.service_port,
    })
  }

  get ports(): _Port[] {
    return [
      this.port,
    ].filter(Boolean)
  }

  get livenessProbe(): input.core.v1.Probe | undefined {
    return
  }

  get readinessProbe(): input.core.v1.Probe | undefined {
    return
  }

  get startupProbe(): input.core.v1.Probe | undefined {
    return
  }

  get resources(): input.core.v1.ResourceRequirements {
    return {

    }
  }

  get environment(): input.core.v1.EnvVar[] {
    return [
      {
        name: 'TZ',
        value: 'America/New_York',
      },
    ]
  }

  get volumes(): input.core.v1.Volume[] {
    return [

    ]
  }

  get volume_mounts(): input.core.v1.VolumeMount[] {
    return [

    ]
  }

  get sidecars(): input.core.v1.Container[] {
    return [

    ]
  }

  get strategy(): input.apps.v1.DeploymentStrategy {
    return {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxSurge: 0,
      },
    }
  }

  get initContainers(): input.core.v1.Container[] {
    return [

    ]
  }

  get command() {
    return [

    ]
  }

  get args() {
    return [

    ]
  }

  @once
  get account(): ServiceAccount {
    return new ServiceAccount(this.name, {
      metadata: {
        name: this.name,
      },
    })
  }

  @once
  get clusterRole() {
    return new ClusterRole(this.name, {
      metadata: {
        name: this.name,
      },
      rules: [{
        apiGroups: [''],
        resources: ['services'],
        verbs: [ 'list', 'watch' ],
      }, {
        apiGroups: [ 'extensions', 'networking.k8s.io' ],
        resources: ['ingresses'],
        verbs: [ 'list', 'watch' ],
      }],
    }, {
      parent: this.account,
    })
  }

  @once
  get crb() {
    return new ClusterRoleBinding(this.name, {
      metadata: {
        name: this.name,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: this.clusterRole.kind,
        name: this.clusterRole.metadata.name!,
      },
      subjects: [
        {
          kind: this.account.kind,
          name: this.account.metadata.name,
          namespace: this.account.metadata.namespace,
        },
      ],
    }, {
      parent: this.account,
    })
  }

  get securityContext(): input.core.v1.SecurityContext | undefined {
    return
  }

  get containerSecurityContext(): input.core.v1.SecurityContext | undefined {
    return
  }

  @once
  get deployment() {
    return new Deployment(this.name, {
      metadata: this.metadata,
      spec: {
        replicas: this.replicas,
        strategy: this.strategy,
        selector: {
          matchLabels: {
            app: this.name,
          },
        },
        template: {
          metadata: this.metadata,
          spec: {
            hostNetwork: true,
            enableServiceLinks: false,
            initContainers: this.initContainers,
            serviceAccountName: this.account?.metadata.name,
            securityContext: this.securityContext,
            volumes: this.volumes,
            containers: [{
              name: 'main',
              image: this.image,
              ports: this.ports.map(port => port.container),
              securityContext: this.containerSecurityContext,
              livenessProbe: this.livenessProbe,
              readinessProbe: this.readinessProbe,
              startupProbe: this.startupProbe,
              resources: this.resources,
              volumeMounts: this.volume_mounts,
              env: this.environment,
              command: this.command,
              args: this.args,
            } as input.core.v1.Container]
              .concat(this.sidecars),
          },
        },
      },
    }, {

    })
  }

  @once
  get service() {
    return new Service(this.name, {
      metadata: this.metadata,
      spec: {
        type: ServiceSpecType.ClusterIP,
        ports: this.ports.map(port => port.service)
          .filter(Boolean) as input.core.v1.ServicePort[],
        selector: {
          app: this.name,
        },
      },
    }, {
      parent: this.deployment,
      dependsOn: [
        this.deployment,
      ],
    })
  }

  get backend(): _IngressBackend {
    return {
      service: {
        name: this.name,
        port: {
          number: this.port.numbers.service,
        },
      },
    }
  }

  get index(): Resource[] {
    return [
      this.deployment,
    ]
  }
}
