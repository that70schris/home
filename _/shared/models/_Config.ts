import { Config } from '@pulumi/pulumi'
import { once } from '../decorators'

export class _Config extends Config {

  static get(key: string): any {
    const [ a, b ] = key.split(':')
    return new _Config(a).get(b)
  }

  static get zones(): any {
    return this.get('cloudflare')?.zones
  }

  constructor(
    public prefix: string,
  ) {
    super()
  }

  @once
  get object(): any {
    return this.getObject(this.prefix)
  }

}
