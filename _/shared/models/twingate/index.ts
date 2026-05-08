import { Config, CustomResourceOptions } from '@pulumi/pulumi'
import { TwingateConnector, TwingateConnectorTokens, TwingateRemoteNetwork, TwingateResource, TwingateResourceArgs } from '@twingate/pulumi-twingate'
import { merge } from 'lodash'

interface _TwingateResourceArgs extends Omit<TwingateResourceArgs,
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
  static config: any = new Config('twingate')
  static network = _TwingateResource.config.get('network')

  static remote = new TwingateRemoteNetwork('main', {
    location: 'ON_PREMISE',
    name: 'local',
  })

  static connector = new TwingateConnector('main', {
    remoteNetworkId: _TwingateResource.remote.id,
    name: 'main',
  })

  static tokens = new TwingateConnectorTokens('main', {
    connectorId: _TwingateResource.connector.id,
  })

  static groups = {
    everyone: { groupId: 'R3JvdXA6Mjg1NTA4' },
  }

  constructor(
    public $name: string,
    args: _TwingateResourceArgs,
    opts?: CustomResourceOptions,
    defaults: TwingateResourceArgs = {
      remoteNetworkId: _TwingateResource.remote.id,
      address: args.address ?? $name,
      name: $name,
      // alias: $name,
      accessGroups: [
        _TwingateResource.groups.everyone,
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
        parent: _TwingateResource.connector,
      }, opts),
    )
  }
}
