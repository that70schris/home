import { Deployment } from '@pulumi/kubernetes/apps/v1';
import { Service, ServiceSpecType } from '@pulumi/kubernetes/core/v1';
import { input } from '@pulumi/kubernetes/types';

import { once } from '../shared/decorators';
import { Port } from './port';

export class KubernetesResource {
  metric?: input.autoscaling.v2.MetricIdentifier;
  name = this.constructor.name.toLowerCase();
  image = this.name;
  container_port = 80;
  service_port?: number;
  internal = false;
  health_path = '/';
  replicas = 1;

  @once
  get metadata(): input.meta.v1.ObjectMeta {
    return {
      name: this.name,
      labels: {
        app: this.name,
      },
    };
  }

  @once
  get http_check(): input.core.v1.HTTPGetAction {
    return {
      path: this.health_path,
      port: this.port.numbers.container,
    };
  }

  @once
  get port(): Port {
    return new Port('main', {
      container: this.container_port,
      service: this.service_port,
    });
  }

  @once
  get ports(): Port[] {
    return [
      this.port,
    ].filter(port => port);
  }

  @once
  get service_ports(): input.core.v1.ServicePort[] {
    return this.ports.map(port => port.service)
      .filter(port => port) as input.core.v1.ServicePort[];
  }

  @once
  get container_ports(): input.core.v1.ContainerPort[] {
    return this.ports.map(port => port.container);
  }

  @once
  get livenessProbe(): input.core.v1.Probe | undefined {
    return;
  }

  @once
  get readinessProbe(): input.core.v1.Probe | undefined {
    return;
  }

  @once
  get startupProbe(): input.core.v1.Probe | undefined {
    return;
  }

  @once
  get resources(): input.core.v1.ResourceRequirements {
    return {

    };
  }

  @once
  get environment(): input.core.v1.EnvVar[] {
    return [
      {
        name: 'PORT',
        value: `${this.port.numbers.container}`,
      },
      {
        name: 'DD_SERVICE',
        value: this.name,
      },
      {
        name: 'DD_LOGS_INJECTION',
        value: 'true',
      },
      {
        name: 'DD_TRACE_CLIENT_IP_ENABLED',
        value: 'true',
      },
      {
        name: 'DD_GIT_REPOSITORY_URL',
        value: 'https://github.com/that70schris/-',
      },
    ];
  }

  @once
  get volumes(): input.core.v1.Volume[] {
    return [

    ];
  }

  @once
  get volume_mounts(): input.core.v1.VolumeMount[] {
    return [

    ];
  }

  @once
  get args() {
    return [

    ];
  }

  @once
  get sidecars(): input.core.v1.Container[] {
    return [

    ];
  }

  @once
  get strategy(): input.apps.v1.DeploymentStrategy {
    return {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxSurge: this.replicas > 1 ? 0 : 1,
        maxUnavailable: Math.min(this.replicas - 1, 1),
      },
    };
  }

  @once
  get initContainers(): input.core.v1.Container[] {
    return [

    ];
  }

  @once
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
            volumes: this.volumes,
            initContainers: this.initContainers,
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
              args: this.args,
              ports: this.container_ports,
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
        type: this.internal ? ServiceSpecType.LoadBalancer : ServiceSpecType.NodePort,
        selector: {
          app: this.name,
        },
        ports: this.service_ports,
      },
    }, {
      parent: this.deployment,
      dependsOn: [
        this.deployment,
      ],
    });
  }
}
