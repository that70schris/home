import { UserArgs } from '@pulumi/gcp/sql'
import * as mysql from '@pulumi/mysql'
import { CustomResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _DatabaseUser, _DatabaseUserArgs } from './database-user'

interface _MySQLUserArgs extends _DatabaseUserArgs {
  privileges?: (
    | 'ALTER'
    | 'CREATE VIEW'
    | 'CREATE'
    | 'DELETE'
    | 'DROP'
    | 'EXECUTE'
    | 'INDEX'
    | 'INSERT'
    | 'PROCESS'
    | 'REFERENCES'
    | 'SELECT'
    | 'SHOW DATABASES'
    | 'SHOW VIEW'
    | 'TRIGGER'
    | 'UPDATE'
    | '')[]
}

export class _MySQLUser extends _DatabaseUser {

  constructor(
    name: string,
    args: _MySQLUserArgs,
    opts?: CustomResourceOptions,
    defaults: UserArgs | any = {
      name: name,
      host: '%',
    },
  ) {
    super(
      name,
      merge(defaults, args),
      opts,
    )

    if (args.privileges)
      new mysql.Grant(`${args.instance.$name}:${name}`, {
        privileges: args.privileges,
        user: this.name,
        host: this.host,
        database: '*',
      }, {
        deleteBeforeReplace: true,
        provider: args.instance.provider,
        dependsOn: this,
        parent: this,
      })

  }

}

export class _MySQLCloudUser extends _MySQLUser {

  constructor(name: string,
    args: _MySQLUserArgs,
    opts: CustomResourceOptions,
    defaults: UserArgs | any = {
      type: 'CLOUD_IAM_USER',
    }) {
    super(
      name,
      merge(defaults, args),
      opts,
    )
  }
}
