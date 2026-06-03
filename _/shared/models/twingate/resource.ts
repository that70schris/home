import { CustomResourceOptions } from '@pulumi/pulumi'
import { TwingateResource, TwingateResourceArgs } from '@twingate/pulumi-twingate'
import { merge } from 'lodash'
import { Twingate } from '.'

export interface _TwingateResourceArgs extends Omit<TwingateResourceArgs,
  | 'remoteNetworkId'
  | 'protocols'
  | 'address'
  | 'name'
  | ''> {
  address?: string
  tcp?: number[]
  udp?: number[]
}

export class _TwingateResource extends TwingateResource {

  constructor(
    public $name: string,
    args: _TwingateResourceArgs,
    opts?: CustomResourceOptions,
    defaults: TwingateResourceArgs = {
      remoteNetworkId: Twingate.remote.id,
      address: args.address ?? $name,
      name: $name,
      // alias: $name,
      accessGroups: [
        Twingate.groups.everyone,
      ],
      protocols: {
        allowIcmp: true,
        tcp: {
          policy: args.tcp?.length == 0 ? 'ALLOW_ALL'
            : args.tcp?.length ? 'RESTRICTED' : 'DENY_ALL',
          ports: args.tcp?.map(port =>
            port.toString()),
        },
        udp: {
          policy: args.udp?.length == 0 ? 'ALLOW_ALL'
            : args.udp?.length ? 'RESTRICTED' : 'DENY_ALL',
          ports: args.udp?.map(port =>
            port.toString()),
        },
      },
    },
  ) {
    super(
      $name,
      merge(defaults, args),
      merge({
        deleteBeforeReplace: true,
        parent: Twingate.remote,
      }, opts),
    )
  }
}
