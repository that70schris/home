import { Database, DatabaseArgs } from '@pulumi/gcp/sql'
import { CustomResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'

import { _DatabaseInstance } from './_Instance'

interface DatabasePlaceholderArgs extends Omit<DatabaseArgs,
  | 'instance'
  | ''> {

}

export class DatabasePlaceholder {

  constructor(
    public name: string,
    public args: DatabasePlaceholderArgs,
    public opts?: CustomResourceOptions,
  ) {

  }
}

interface _DatabaseArgs extends Omit<DatabaseArgs,
  | 'instance'
  | ''> {
  instance: _DatabaseInstance
}

export class _Database extends Database {

  constructor(
    public $name: string,
    args: _DatabaseArgs,
    opts?: CustomResourceOptions,
    defaults: DatabaseArgs = {
      instance: args.instance.name,
      name: $name,
    },
  ) {
    super(
      `${args.instance.$name}:${$name}`,
      merge(defaults, args, {
        instance: args.instance.name,
      }),
      merge({
        dependsOn: args.instance,
        parent: args.instance,
      }, opts),
    )
  }
}
