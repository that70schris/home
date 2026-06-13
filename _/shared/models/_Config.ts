import { Config, getStack } from '@pulumi/pulumi'

export class _Config extends Config {

  static get(key: string): any {
    const [ a, b ] = key.split(':')

    return b
      ? new _Config(a).get(b)
      : new _Config().getObject(a)
  }

  static get zones(): any {
    return this.get('cloudflare')?.zones
  }

  static get env(): string {
    return getStack()
  }

  static get subdomain(): string {
    return this.env == 'prod' ? '' : `${this.env}.`
  }

}
