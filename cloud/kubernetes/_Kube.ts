import { Deployment } from '@pulumi/kubernetes/apps/v1';
import { Service, ServiceSpecType } from '@pulumi/kubernetes/core/v1';
import { input } from '@pulumi/kubernetes/types';
import { Resource } from '@pulumi/pulumi';
import { _Port } from '.';
import { once } from '../../shared/decorators';

export class _Kube {
  container_port = 80;
  service_port?: number;
  path = '/';
  replicas = 1;

  constructor(
    public domain?: string,
    public name: string = this.constructor.name.toLowerCase(),
    public image: string = this.name,
  ) {

  }

  get metadata(): input.meta.v1.ObjectMeta {
    return {
      name: this.name,
      labels: {
        app: this.name,
      },
    };
  }

  get http_check(): input.core.v1.HTTPGetAction {
    return {
      path: this.path,
      port: this.port.numbers.container,
    };
  }

  @once
  get port(): _Port {
    return new _Port('main', {
      container: this.container_port,
      service: this.service_port,
    });
  }

  get ports(): _Port[] {
    return [
      this.port,
    ];
  }

  get livenessProbe(): input.core.v1.Probe | undefined {
    return;
  }

  get readinessProbe(): input.core.v1.Probe | undefined {
    return;
  }

  get startupProbe(): input.core.v1.Probe | undefined {
    return;
  }

  get resources(): input.core.v1.ResourceRequirements {
    return {

    };
  }

  get environment(): input.core.v1.EnvVar[] {
    return [

    ];
  }

  get volumes(): input.core.v1.Volume[] {
    return [

    ];
  }

  get volume_mounts(): input.core.v1.VolumeMount[] {
    return [

    ];
  }

  get sidecars(): input.core.v1.Container[] {
    return [

    ];
  }

  get strategy(): input.apps.v1.DeploymentStrategy {
    return {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxSurge: this.replicas > 1 ? 0 : 1,
        maxUnavailable: Math.min(this.replicas - 1, 1),
      },
    };
  }

  get initContainers(): input.core.v1.Container[] {
    return [

    ];
  }

  get command() {
    return [

    ];
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
            enableServiceLinks: false,
            initContainers: this.initContainers,
            volumes: this.volumes,
            hostNetwork: true,
            containers: [{
              name: 'main',
              image: this.image,
              livenessProbe: this.livenessProbe,
              readinessProbe: this.readinessProbe,
              startupProbe: this.startupProbe,
              resources: this.resources,
              volumeMounts: this.volume_mounts,
              env: this.environment,
              command: this.command,
              ports: this.ports.map(port => port.container),
            } as input.core.v1.Container]
              .concat(this.sidecars),
          },
        },
      },
    }, {

    });
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
    });
  }

  get backend(): input.networking.v1.IngressBackend {
    return {
      service: {
        name: this.name,
        port: {
          number: this.port.numbers.service,
        },
      },
    };
  }

  includes: Resource[] = [

  ];
}
