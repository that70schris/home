import { IngressController } from '@pulumi/kubernetes-ingress-nginx';
import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1';
import { input } from '@pulumi/kubernetes/types';
import { CustomResourceOptions, Input, interpolate } from '@pulumi/pulumi';
import { merge } from 'lodash';
import { _Record } from '../cloudflare/_Record';
import { Twingate } from '../twingate';

interface _IngressRule extends input.networking.v1.IngressRule {
  host: string
}

interface _IngressArgs extends IngressArgs {
  rules: _IngressRule[]
  zoneId?: Input<string>
  internal?: boolean
  twingate?: boolean
  proxied?: boolean
}

interface IngressResourceOptions extends CustomResourceOptions {
  issuer: CustomResource
  controller: IngressController
}

export class _Ingress extends Ingress {

  constructor(
    public $name: string,
    private args: _IngressArgs,
    opts: IngressResourceOptions,
  ) {
    const certs: { [key: string]: CustomResource } =
      args.rules.reduce((result, rule) => ({
        ...result,
        [rule.host]: new CustomResource(rule.host, {
          apiVersion: 'cert-manager.io/v1',
          kind: 'Certificate',
          metadata: {
            name: rule.host,
          },
          spec: {
            secretName: rule.host,
            dnsNames: [
              rule.host,
            ],
            issuerRef: {
              name: opts.issuer.metadata.name,
            },
          },
        }, {
          dependsOn: opts.issuer,
          parent: opts.issuer,
        }),
      }), {});

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
          rules: args.rules.map(rule => ({
            ...rule,
            host: rule.host,
          })),
          tls: args.rules.map(rule => ({
            secretName: certs[rule.host].metadata.name,
            hosts: [rule.host],
          })),
        },
      } as IngressArgs,
      args),
      {
        ...opts,
        dependsOn: [
          opts.controller,
        ].concat(opts.dependsOn as any),
      },
    );

    this.status.loadBalancer?.ingress[0].ip.apply((ip) => {
      args.rules.forEach((rule) => {
        interpolate`${rule.host}`.apply((host) => {
          new _Record(host, {
            name: rule.host,
            content: ip,
            proxied: args.proxied,
          }, {
            parent: this,
          });

          new Twingate(host, {
            isBrowserShortcutEnabled: true,
            address: host,
            ports: [
              '443',
            ],
          }, {
            parent: this,
          });
        });
      });
    });
  }
}
