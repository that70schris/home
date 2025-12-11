import { Config } from '@pulumi/pulumi'

export class _Config extends Config {

  constructor(
    public prefix: string,
  ) {
    super()
  }

  get object(): any {
    return this.getObject(this.prefix)
  }

}
