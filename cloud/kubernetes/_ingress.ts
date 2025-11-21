import { IngressController } from '@pulumi/kubernetes-ingress-nginx';
import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1';
import { input } from '@pulumi/kubernetes/types';
import { CustomResourceOptions, Input, interpolate } from '@pulumi/pulumi';
import { merge } from 'lodash';
import { _Record } from '../cloudflare/_record';
import { Twingate } from '../twingate';

interface _IngressRule extends input.networking.v1.IngressRule {
  alias?: string
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
    const certificate = new CustomResource($name, {
      apiVersion: 'cert-manager.io/v1',
      kind: 'Certificate',
      metadata: {
        name: $name,
      },
      spec: {
        secretName: $name,
        dnsNames: args.rules.map(rule => rule.alias ?? rule.host),
        issuerRef: {
          name: opts.issuer.metadata.name,
        },
      },
    }, {
      dependsOn: opts.issuer,
      parent: opts.issuer,
    });

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
            host: rule.alias
              ?? rule.host,
          })),
          tls: [{
            secretName: certificate.metadata.name,
            hosts: args.rules.map(rule => rule.alias ?? rule.host),
          }],
        },
      } as IngressArgs, args),
      {
        ...opts,
        dependsOn: [opts.controller]
          .concat(opts.dependsOn as any),
      },
    );

    this.status.loadBalancer?.ingress[0].ip.apply((ip) => {
      args.rules.forEach((rule) => {
        interpolate`${rule.host}`.apply((host) => {
          new _Record(host, {
            name: rule.host,
            domain: 'bailey.mx',
            content: ip,
            proxied: args.proxied,
          }, {
            parent: this,
          });

          new Twingate(rule.alias ?? host, {
            isBrowserShortcutEnabled: true,
            alias: rule.alias,
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
