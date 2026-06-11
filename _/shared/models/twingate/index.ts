import { Config } from '@pulumi/pulumi'
import { TwingateConnector, TwingateConnectorTokens, TwingateRemoteNetwork } from '@twingate/pulumi-twingate'
import { once } from '../../decorators'

export class Twingate {
  static config = new Config('twingate')
  static network = Twingate.config.get('network')
  static groups = {
    admin: { groupId: 'R3JvdXA6ODE3MTA4' },
    everyone: { groupId: 'R3JvdXA6Mjg1NTA4' },
  }

  constructor(
    public name: string,
  ) {
    this.tokens
  }

  @once
  get remote() {
    return new TwingateRemoteNetwork('main', {
      location: 'ON_PREMISE',
      name: this.name,
    })
  }

  @once
  get connector() {
    return new TwingateConnector('main', {
      remoteNetworkId: this.remote.id,
      name: 'main',
    })
  }

  @once
  get tokens() {
    return new TwingateConnectorTokens('main', {
      connectorId: this.connector.id,
    })
  }

}
