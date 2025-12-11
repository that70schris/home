import { CustomResource } from '@pulumi/kubernetes/apiextensions'
import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1'
import { input } from '@pulumi/kubernetes/types'
import { CustomResourceOptions, interpolate } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _Cluster, _CustomResource } from '.'
import { _Record } from '../cloudflare'
import { Twingate } from '../twingate'

interface _IngressServiceBackend extends input.networking.v1.IngressServiceBackend {
  port: input.networking.v1.ServiceBackendPort
}

export interface _IngressBackend extends input.networking.v1.IngressBackend {
  service: _IngressServiceBackend
}

interface _HTTPIngressPath extends input.networking.v1.HTTPIngressPath {
  backend: _IngressBackend
}

interface _HTTPIngressRuleValue extends input.networking.v1.HTTPIngressRuleValue {
  paths: _HTTPIngressPath[]
}

interface _IngressRule extends input.networking.v1.IngressRule {
  host: string
  internal?: boolean
  twingate?: boolean
  proxied?: boolean
  http?: _HTTPIngressRuleValue
}

interface _IngressArgs extends IngressArgs {
  rules: _IngressRule[]
}

interface IngressResourceOptions extends CustomResourceOptions {
  cluster: _Cluster
  issuer: CustomResource
}

export class _Ingress extends Ingress {

  constructor(
    public $name: string,
    private args: _IngressArgs,
    opts: IngressResourceOptions,
  ) {
    const certs: { [key: string]: _CustomResource } =
      args.rules?.reduce((result, rule) => ({
        ...result,
        [rule.host]: new _CustomResource(rule.host, {
          apiVersion: 'cert-manager.io/v1',
          kind: 'Certificate',
          spec: {
            secretName: rule.host,
            dnsNames: [
              rule.host,
            ],
            issuerRef: {
              kind: opts.issuer.kind,
              name: opts.issuer.metadata.name,
            },
          },
        }, {
          dependsOn: opts.issuer,
        }),
      }), {})

    super(
      $name,
      merge({
        metadata: {
          name: $name,
          annotations: {
            'cert-manager.io/issuer': opts.issuer.metadata.name,
            'nginx.ingress.kubernetes.io/rewrite-target': '/',
          },
        },
        spec: {
          ingressClassName: 'nginx',
          rules: args.rules,
          tls: args.rules?.map(rule => ({
            secretName: certs[rule.host].metadata.name,
            hosts: [rule.host],
          })),
        },
      } as IngressArgs,
      args),
      {
        ...opts,
        dependsOn: [
          opts.cluster.nginx,
          ...Object.values(certs),
        ].concat(opts.dependsOn as any),
      },
    )

    this.status.loadBalancer?.ingress[0].ip.apply((ip) => {
      args.rules.forEach((rule) => {
        interpolate`${rule.host}`.apply((host) => {
          new _Record(host, {
            name: host,
            content: ip,
            proxied: rule.proxied,
          }, {
            parent: this,
          })

          new Twingate(host, {
            isBrowserShortcutEnabled: true,
            tcp: rule.http?.paths?.map((path) => {
              return path.backend.service.port.number as number
            }),
          }, {
            parent: this,
          })

        })
      })
    })

  }
}
