import { Plex } from './plex';

import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Chart } from '@pulumi/kubernetes/helm/v4';
import { Directory } from '@pulumi/kubernetes/kustomize/v2';
import { Twingate } from './twingate';

new Chart('twingate', {
  repositoryOpts: {
    repo: 'https://twingate.github.io/helm-charts',
  },
  chart: 'connector',
  values: {
    connector: {
      network: Twingate.network,
      accessToken: Twingate.tokens.accessToken,
      refreshToken: Twingate.tokens.refreshToken,
    },
    resources: {
      requests: {
        memory: '.5Gi',
        cpu: '.25',
      },
    },
  },
});

const manager = new Chart('manager', {
  repositoryOpts: {
    repo: 'https://charts.jetstack.io',
  },
  chart: 'cert-manager',
  values: {
    global: {
      leaderElection: {
        namespace: 'default',
      },
    },
    installCRDs: true,
    prometheus: {
      enabled: false,
    },
  },
});

const issuer = new CustomResource('issuer', {
  apiVersion: 'cert-manager.io/v1',
  kind: 'Issuer',
  metadata: {
    name: 'issuer',
  },
  spec: {
    selfSigned: {},
  },
}, {
  deleteBeforeReplace: true,
  dependsOn: manager,
});

const certificate = new CustomResource('berry', {
  apiVersion: 'cert-manager.io/v1',
  kind: 'Certificate',
  metadata: {
    name: 'berry',
  },
  spec: {
    secretName: 'berry',
    dnsNames: [
      'berry.local',
      'berry',
    ],
    issuerRef: {
      name: issuer.metadata.name,
    },
  },
}, {
  dependsOn: issuer,
  parent: issuer,
});

new Twingate('berry', {
  isBrowserShortcutEnabled: true,
  address: 'berry',
  ports: [
    '443',
    '80',
  ],
});

const directory = new Directory('nginx', {
  directory: 'https://github.com/nginx/nginx-gateway-fabric/config/crd/gateway-api/standard',
}, {
  dependsOn: manager,
});

const nginx = new Chart('nginx', {
  chart: 'oci://ghcr.io/nginx/charts/nginx-gateway-fabric',
  values: {
    certGenerator: {
      // agentTLSSecretName: certificate.metadata.name,
      serverTLSSecretName: certificate.metadata.name,
    },
  },
}, {
  dependsOn: directory,
});

const gateway_class = new CustomResource('gateway-class', {
  apiVersion: 'gateway.networking.k8s.io/v1',
  kind: 'GatewayClass',
  metadata: {
    name: 'nginx',
  },
  spec: {
    controllerName: 'gateway.nginx.org/nginx-gateway-controller',
  },
}, {
  deleteBeforeReplace: true,
  dependsOn: nginx,
});

const gateway = new CustomResource('gateway', {
  apiVersion: 'gateway.networking.k8s.io/v1',
  metadata: {
    name: 'berry',
  },
  kind: 'Gateway',
  spec: {
    gatewayClassName: gateway_class.metadata.name,
    listeners: [{
      name: 'http',
      protocol: 'HTTP',
      hostname: 'berry',
      port: 80,
    }],
  },
}, {
  deleteBeforeReplace: true,
  dependsOn: gateway_class,
});

new CustomResource(`Route`, {
  apiVersion: 'gateway.networking.k8s.io/v1',
  kind: 'HTTPRoute',
  metadata: {
    name: 'berry',
  },
  spec: {
    parentRefs: [{
      name: gateway.metadata.name,
      sectionName: 'http',
    }],
    hostnames: [
      'berry',
    ],
    rules: [
      new Plex(),
    ].map((service) => {
      service.service;

      return {
        matches: [{
          path: {
            type: 'PathPrefix',
            value: `/`,
          },
        }],
        // filters: [{
        //   type: 'URLRewrite',
        //   urlRewrite: {
        //     path: {
        //       type: 'ReplacePrefixMatch',
        //       replacePrefixMatch: '/',
        //     },
        //   },
        // }],
        backendRefs: [{
          name: service.name,
          port: service.service_port,
        }],

      };
    }),
  },
}, {
  deleteBeforeReplace: true,
  dependsOn: [
    gateway,
  ],
});
