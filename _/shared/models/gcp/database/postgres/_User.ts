import { UserArgs } from '@pulumi/gcp/sql'
import * as postgres from '@pulumi/postgresql'
import { CustomResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _PostgresInstance } from '.'
import { _DatabaseUser, _DatabaseUserArgs } from '..'

interface _PostgresUserArgs extends _DatabaseUserArgs {
  instance: _PostgresInstance
  privileges?: {
    function?: (
      | 'EXECUTE'
      | '')[]
    table?: (
      | 'ALL PRIVILEGES'
      | 'DELETE'
      | 'INSERT'
      | 'REFERENCES'
      | 'SELECT'
      | 'TRIGGER'
      | 'TRUNCATE'
      | 'UPDATE'
      | string)[]
    schema?: (
      | 'USAGE'
      | '')[]
    sequence?: (
      | 'SELECT'
      | 'UPDATE'
      | 'USAGE'
      | '')[]
  }
}

export class _PostgresUser extends _DatabaseUser {

  constructor(
    name: string,
    args: _PostgresUserArgs,
    opts?: CustomResourceOptions,
    defaults: UserArgs | any = {
      name: name,
    },
  ) {
    super(
      name,
      merge(defaults, args),
      opts,
    )

    args.instance.databases.forEach((database) => {
      Object.keys(args.privileges ?? {}).forEach((type) => {
        const urn = `${database.$name}:${type}:${name}`

        // access to existing resources
        new postgres.Grant(urn, {
          privileges: args.privileges[type],
          objectType: type,
          database: database.name,
          schema: 'public',
          role: name,
        }, {
          deleteBeforeReplace: true,
          provider: args.instance.provider,
          dependsOn: this,
          parent: this,
        })

        args.instance.owners?.forEach((owner) => {
          // access to future resources
          new postgres.DefaultPrivileges(`${urn}:${owner}`, {
            owner: owner,
            privileges: args.privileges[type],
            objectType: type,
            database: database.name,
            schema: 'public',
            role: name,
          }, {
            deleteBeforeReplace: true,
            provider: args.instance.provider,
            dependsOn: this,
            parent: this,
          })
        })
      })
    })
  }

}

export class _PostgresCloudUser extends _PostgresUser {

  constructor(name: string,
    args: _PostgresUserArgs,
    opts?: CustomResourceOptions,
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
