import { Deployment } from '@pulumi/kubernetes/apps/v1'
import { Service, ServiceAccount, ServiceSpecType } from '@pulumi/kubernetes/core/v1'
import { ClusterRole, ClusterRoleBinding } from '@pulumi/kubernetes/rbac/v1'
import { input } from '@pulumi/kubernetes/types'
import { Resource } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _Port } from '.'
import { once } from '../../decorators'

export interface _KubeSpec {
  https?: boolean
  domain?: string
  image?: string
  container_port?: number
  service_port?: number
  path?: string
  replicas?: number
  gateway?: boolean
  hostNetwork?: boolean
}

export class _Kube {
  spec: _KubeSpec = {
    image: this.name,
    https: false,
    container_port: 8080,
    service_port: 8443,
    path: '/',
    replicas: 1,
    gateway: false,
    hostNetwork: false,
  }

  constructor(
    overrides: _KubeSpec = {

    },
  ) {
    merge(
      this.spec,
      overrides,
    )

    this.index
  }

  @once
  get name() {
    return this.constructor.name.toLowerCase()
  }

  @once
  get metadata(): input.meta.v1.ObjectMeta {
    return {
      name: this.name,
      labels: {
        app: this.name,
      },
    }
  }

  @once
  get http_check(): input.core.v1.HTTPGetAction {
    return {
      path: this.spec.path,
      port: this.port?.numbers.container ?? 80,
    }
  }

  @once
  get port(): _Port | null {
    return this.spec.container_port ? new _Port('main', {
      container: this.spec.container_port,
      service: this.spec.service_port,
    }) : null
  }

  get ports(): _Port[] {
    return [
      this.port,
    ].filter(Boolean) as _Port[]
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

  get args(): string[] {
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

  get securityContext(): input.core.v1.PodSecurityContext | undefined {
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
        replicas: this.spec.replicas,
        strategy: this.strategy,
        selector: {
          matchLabels: {
            app: this.name,
          },
        },
        template: {
          metadata: this.metadata,
          spec: {
            hostNetwork: this.spec.hostNetwork,
            dnsPolicy: 'ClusterFirstWithHostNet',
            enableServiceLinks: false,
            initContainers: this.initContainers,
            serviceAccountName: this.account?.metadata.name,
            securityContext: this.securityContext,
            volumes: this.volumes,
            containers: [{
              name: 'main',
              image: this.spec.image,
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

  get backend() {
    return {
      name: this.name,
      port: this.port?.numbers.service,
    }
  }

  get index(): Resource[] {
    return [
      this.deployment,
    ]
  }
}
