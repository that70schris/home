import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1';
import { input } from '@pulumi/kubernetes/types';
import { CustomResourceOptions, Input, interpolate } from '@pulumi/pulumi';
import { merge } from 'lodash';

import { Twingate } from './twingate';

interface _IngressArgs extends IngressArgs {
  rules: input.networking.v1.IngressRule[]
  zoneId?: Input<string>
  internal?: boolean
  twingate?: boolean
  proxied?: boolean
}

export class _Ingress extends Ingress {
  constructor(
    public $name: string,
    private args: _IngressArgs,
    opts: CustomResourceOptions,
  ) {
    super(
      $name,
      merge({
        metadata: {
          name: $name,
          annotations: {
            // 'kubernetes.io/ingress.allow-http': `${!args.internal}`,
            // 'kubernetes.io/ingress.class': args.internal ? 'gce-internal' : 'gce',
            // [`kubernetes.io/ingress.${args.internal ? 'regional' : 'global'}-static-ip-name`]: address?.name,
            // 'networking.gke.io/v1beta1.FrontendConfig': config?.metadata.name,
            // 'cert-manager.io/issuer': opts.parent.issuer.metadata.name,
          },
        },
        spec: {
          rules: args.rules,
          tls: [{
            // secretName: opts.parent.wildcard.metadata.name,
            hosts: args.rules.map(rule => rule.host),
          }],
        },
      } as IngressArgs, args),
      opts,
    );

    args.rules.forEach((rule) => {
      interpolate`${rule.host}`.apply((host) => {
        // new _Record(host, {
        //   name: rule.host,
        //   zoneId: args.zoneId,
        //   content: address.address,
        //   proxied: args.proxied,
        // }, {
        //   parent: this,
        // });

        new Twingate(host, {
          address: host,
          isBrowserShortcutEnabled: true,
          ports: [
            '443',
          ],
        }, {
          parent: this,
        });
      });
    });
  }
}
