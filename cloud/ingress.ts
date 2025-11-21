import { IngressController } from '@pulumi/kubernetes-ingress-nginx';
import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1';
import { input } from '@pulumi/kubernetes/types';
import { CustomResourceOptions, Input } from '@pulumi/pulumi';
import { merge } from 'lodash';

const nginx = new IngressController('nginx', {
  fullnameOverride: 'nginx',
  // nameOverride: 'nginx',
  controller: {
    name: 'controller',
    publishService: {
      enabled: true,
    },
  },
});

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
}

export class _Ingress extends Ingress {
  constructor(
    public $name: string,
    private args: _IngressArgs,
    opts: IngressResourceOptions,
  ) {
    super(
      $name,
      merge({
        metadata: {
          name: $name,
          annotations: {
            'cert-manager.io/issuer': opts.issuer.metadata.name,
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
            secretName: new CustomResource($name, {
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
            }).metadata.name,
            hosts: args.rules.map(rule => rule.alias ?? rule.host),
          }],
        },
      } as IngressArgs, args),
      {
        ...opts,
        dependsOn: [nginx]
          .concat(opts.dependsOn as any),
      },
    );

    // args.rules.forEach((rule) => {
    //   interpolate`${rule.host}`.apply((host) => {
    //     // new _Record(host, {
    //     //   name: rule.host,
    //     //   zoneId: args.zoneId,
    //     //   content: address.address,
    //     //   proxied: args.proxied,
    //     // }, {
    //     //   parent: this,
    //     // });

    //     new Twingate(rule.alias ?? host, {
    //       isBrowserShortcutEnabled: true,
    //       alias: rule.alias,
    //       address: host,
    //       ports: [
    //         '443',
    //       ],
    //     }, {
    //       parent: this,
    //     });
    //   });
    // });
  }
}
