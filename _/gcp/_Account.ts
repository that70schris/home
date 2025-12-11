import { Account } from '@pulumi/gcp/serviceaccount'
import { CustomResourceOptions, Output } from '@pulumi/pulumi'
import { merge } from 'lodash'

import { _GroupMember, _Member, _ServiceMember } from '.'

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
  email?: string
  displayName?: string
}

export class _Account {

  constructor(
    name,
    public args: _AccountArgs = {},
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
    public args: _AccountArgs = {},
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
    name,
    public args: _AccountArgs = {},
    opts?: CustomResourceOptions,
    defaults = {
      displayName: name,
      accountId: name,
    },
  ) {
    super(
      name,
      merge(defaults, args),
      opts,
    )

    this.args.email.apply((_email) => {
      args.roles?.forEach((role) => {
        role.apply?.((role) => {
          new _ServiceMember(name, {
            email: args.email ?? _email,
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
