import { Service } from '@pulumi/kubernetes/core/v1'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { ResourceOptions } from '@pulumi/pulumi'
import * as tailscale from '@pulumi/tailscale'
import { _CustomResource, _Kube } from '.'
import { once } from '../../decorators'
import { Twingate } from '../twingate'

interface ClusterArgs {
  host: string
  kubes: _Kube[]
}

export class _Cluster {

  constructor(
    public name: string,
    public args: ClusterArgs,
    public opts?: ResourceOptions,
  ) {
    this.index
    args.kubes.forEach((kube) => {
      kube.index?.forEach((resource) => {
        switch (resource.constructor) {
          case Service:
            // new _TwingateResource(kube.name, {
            //   address: `${kube.name}.${kube.metadata.namespace ?? 'default'}.svc.cluster.local`,
            // }, {
            //   dependsOn: resource,
            //   parent: resource,
            // })
            break
        }
      })

      return kube.index
    })
  }

  // manager = new Chart('manager', {
  //   chart: 'cert-manager',
  //   repositoryOpts: {
  //     repo: 'https://charts.jetstack.io',
  //   },
  //   values: {
  //     fullnameOverride: 'certificate',
  //     crds: {
  //       enabled: true,
  //       keep: false,
  //     },
  //     global: {
  //       leaderElection: {
  //         namespace: 'default',
  //       },
  //     },
  //   },
  // })

  // cloudflare = new Secret('cloudflare', {
  //   metadata: {
  //     name: 'cloudflare',
  //   },
  //   stringData: {
  //     token: new Config('cloudflare')
  //       .require('apiToken'),
  //   },
  // })

  // root = new _CustomResource('root', {
  //   apiVersion: 'cert-manager.io/v1',
  //   kind: 'ClusterIssuer',
  //   spec: {
  //     selfSigned: {},
  //   },
  // })

  // cert = new _CustomResource('root', {
  //   apiVersion: 'cert-manager.io/v1',
  //   kind: 'Certificate',
  //   spec: {
  //     isCA: true,
  //     commonName: 'bailey.mx',
  //     secretName: this.root.metadata.name,
  //     privateKey: {
  //       algorithm: 'ECDSA',
  //       size: 256,
  //     },
  //     issuerRef: {
  //       kind: this.root.kind,
  //       name: this.root.metadata.name,
  //     },
  //   },
  // }, {
  //   dependsOn: [
  //     this.root,
  //   ],
  // })

  // private = new _CustomResource('private', {
  //   apiVersion: 'cert-manager.io/v1',
  //   kind: 'ClusterIssuer',
  //   spec: {
  //     ca: {
  //       secretName: this.cert.metadata.name,
  //     },
  //   },
  // }, {
  //   dependsOn: [
  //     this.cert,
  //   ],
  // })

  // letsencrypt = new _CustomResource('letsencrypt', {
  //   apiVersion: 'cert-manager.io/v1',
  //   kind: 'ClusterIssuer',
  //   spec: {
  //     acme: {
  //       server: 'https://acme-v02.api.letsencrypt.org/directory',
  //       email: new Config().require('email'),
  //       privateKeySecretRef: {
  //         name: 'letsencrypt',
  //       },
  //       solvers: [{
  //         dns01: {
  //           cloudflare: {
  //             apiTokenSecretRef: {
  //               name: this.cloudflare.metadata.name,
  //               key: 'token',
  //             },
  //           },
  //         },
  //       }],
  //     },
  //   },
  // }, {
  //   deleteBeforeReplace: true,
  //   dependsOn: [
  //     this.cloudflare,
  //     this.manager,
  //   ],
  // })

  // nginx = new IngressController('nginx', {
  //   fullnameOverride: 'nginx',
  //   controller: {
  //     containerName: 'main',
  //   },
  // })

  // @once
  // get ingress() {
  //   return new _Ingress('nginx', {
  //     rules: this.args?.kubes
  //       .filter((kube) => {
  //         return kube.ingress
  //       }).map(kube => ({
  //         host: [
  //           kube.name,
  //           kube.overrides.domain
  //           ?? this.args.domain,
  //         ].filter(Boolean).join('.'),
  //         http: {
  //           paths: [{
  //             backend: kube.backend,
  //             pathType: 'Prefix',
  //             path: '/',
  //           }],
  //         },
  //       })),
  //   }, {
  //     cluster: this,
  //     issuer: this.letsencrypt,
  //   })
  // }

  @once
  get twingate_operator() {
    return new Chart('twingate', {
      chart: 'oci://ghcr.io/twingate/helmcharts/twingate-operator',
      values: {
        nameOverride: 'operator',
        twingateOperator: {
          remoteNetworkId: Twingate.remote.id,
          apiKey: Twingate.config.get('apiToken'),
          network: Twingate.network,
        },
        // gateway: {
        //   enabled: true,
        //   twingate: {
        //     network: Twingate.remote.id,
        //     resource: {
        //       enabled: true,
        //       extraAnnotations: {
        //         'resource.twingate.com/name': `_${this.name}`,
        //         'resource.twingate.com/alias': this.args.host,
        //       },
        //     },
        //   },
        // },
      },
    })
  }

  @once
  get twingate_connector() {
    return new _CustomResource(
      'twingate-connector', {
        apiVersion: 'twingate.com/v1beta',
        kind: 'TwingateConnector',
        spec: {
          name: 'main',
          imagePolicy: {
            schedule: '0 0 * * *',
          },
        },
      }, {
        dependsOn: this.twingate_operator,
        parent: this.twingate_operator,
      },
    )
  }

  @once
  get twingate_resource() {
    return new _CustomResource(
      'twingate-resource', {
        apiVersion: 'twingate.com/v1beta',
        kind: 'TwingateResource',
        spec: {
          // needs a proxy?
          address: 'kubernetes.default.svc.cluster.local',
          name: `_${this.name}`,
          tlsSecret: 'twingate-gateway-tls',
          alias: 'kube.berry.home',
          type: 'Kubernetes',
        },
      },
    )
  }

  @once
  get tailscale() {
    return new Chart('tailscale', {
      chart: 'tailscale-operator',
      repositoryOpts: {
        repo: 'https://pkgs.tailscale.com/helmcharts',
      },
      values: {
        apiServerProxyConfig: {
          mode: true,
        },
        oauth: {
          clientId: tailscale.config.oauthClientId,
          clientSecret: tailscale.config.oauthClientSecret,
        },
        operatorConfig: {
          hostname: 'operator',
        },
      },
    })
  }

  @once
  get index() {
    return [
      // this.ingress,
      // this.tailscale,
      this.twingate_operator,
      this.twingate_connector,
      // this.twingate_resource,
      // this.twingate_resource_access,
      // this.twingate_role_binding,
      // ...new mDNS().index,
    ]
  }

  @once
  get twingate_resource_access() {
    return new _CustomResource(
      'twingate-resource-access', {
        apiVersion: 'twingate.com/v1beta',
        kind: 'TwingateResourceAccess',
        spec: {
          resourceRef: {
            name: 'twingate-gateway-resource',
          },
          principalExternalRef: {
            name: 'Chris Bailey',
            type: 'group',
          },
        },
      }, {
        dependsOn: this.twingate_operator,
        // parent: this.twingate_operator,
      },
    )
  }

  @once
  get twingate_role_binding() {
    return new _CustomResource(
      'twingate-role-binding', {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRoleBinding',
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
          name: 'edit',
        },
        subjects: [{
          apiGroup: 'rbac.authorization.k8s.io',
          name: 'Chris Bailey',
          kind: 'Group',
        }],
      }, {
        dependsOn: this.twingate_operator,
      // parent: this.twingate_operator,
      },
    )
  }

}
