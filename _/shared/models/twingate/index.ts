import { Config } from '@pulumi/pulumi'
import { TwingateConnector, TwingateConnectorTokens, TwingateRemoteNetwork } from '@twingate/pulumi-twingate'
import { once } from '../../decorators'

export class Twingate {
  static config: any = new Config('twingate')
  static network = Twingate.config.get('network')

  static remote = new TwingateRemoteNetwork('main', {
    location: 'ON_PREMISE',
    name: 'home.lab',
  })

  @once
  static get connector() {
    return new TwingateConnector('main', {
      remoteNetworkId: Twingate.remote.id,
      name: 'main',
    })
  }

  @once
  static get tokens() {
    return new TwingateConnectorTokens('main', {
      connectorId: Twingate.connector.id,
    })
  }

  static groups = {
    admin: { groupId: 'R3JvdXA6ODE3MTA4' },
    everyone: { groupId: 'R3JvdXA6Mjg1NTA4' },
  }
}
