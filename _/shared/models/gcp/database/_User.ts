import { User, UserArgs } from '@pulumi/gcp/sql'
import * as inputs from '@pulumi/kubernetes/types/input'
import { CustomResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _DatabaseInstance } from './_Instance'

export interface _DatabaseUserArgs extends Omit<UserArgs,
  | 'instance'
  | ''> {
  instance: _DatabaseInstance
}

export class _DatabaseUser extends User {
  public $password

  constructor(
    name: string,
    args: _DatabaseUserArgs,
    opts?: CustomResourceOptions,
    defaults: UserArgs = {
      instance: args.instance.name,
      password: args.instance.config[name]?.password,
      name: name,
    },
  ) {
    const _args = merge(defaults, args)

    super(
      `${args.instance.$name}:${name}`,
      _args,
      merge({
        dependsOn: args.instance,
        parent: args.instance,
      }, opts),
    )

    this.$password = _args.password
  }

  get env(): inputs.core.v1.EnvVar[] {
    return [{
      name: 'DB_USER',
      value: this.name,
    }, {
      name: 'DB_PASSWORD',
      value: this.password,
    }]
  }
}
