import { Account } from '@pulumi/gcp/serviceaccount'
import { CustomResourceOptions, Output } from '@pulumi/pulumi'
import { merge } from 'lodash'

import { _GroupMember, _Member, _ServiceMember } from '.'
import { _Config } from '../..'

declare global {
  interface String {
    apply(callback: Function): string
  }
}

String.prototype.apply = function(callback: Function) {
  return callback(this)
}

interface _AccountArgs {
  roles?: (string | Output<string>)[]
  displayName?: string
}

interface _ServiceAccountArgs extends _AccountArgs {
  id?: string
}

interface _UserAccountArgs extends _AccountArgs {
  email?: string
}

export class _Account {

  constructor(
    name: string,
    public args: _UserAccountArgs = {},
    opts?: CustomResourceOptions,
  ) {
    args.roles?.forEach((role) => {
      role.apply?.((role) => {
        new _Member(name, {
          email: args.email,
          role: role,
        }, opts)
      })
    })
  }
}

export class _GroupAccount {

  constructor(
    name,
    public args: _UserAccountArgs = {},
    opts?: CustomResourceOptions,
  ) {
    args.roles?.forEach((role) => {
      role.apply?.((role) => {
        new _GroupMember(name, {
          email: args.email,
          role: role,
        }, opts)
      })
    })
  }

}

export class _ServiceAccount extends Account {

  constructor(
    name: string,
    public args: _ServiceAccountArgs = {},
    opts?: CustomResourceOptions,
    defaults = {
      displayName: name,
      accountId: args.id ?? name,
    },
  ) {
    super(
      name,
      merge(defaults, args),
      opts,
    )

    this.accountId.apply((id: string) => {
      args.roles?.forEach((role) => {
        role.apply?.((role) => {
          new _ServiceMember(name, {
            email: `${id}@${_Config.get('gcp:project')}.iam.gserviceaccount.com`,
            role: role,
          }, {
            dependsOn: this,
            parent: this,
          })
        })
      })
    })
  }

}
