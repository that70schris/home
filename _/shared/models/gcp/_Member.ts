import { IAMMember, IAMMemberArgs } from '@pulumi/gcp/projects'
import { CustomResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _Config } from '..'

interface _MemberArgs extends Omit<IAMMemberArgs,
  | 'project'
  | 'member'
  | ''> {
  scope?: string
  email: string
  role: string
}

export class _Member extends IAMMember {

  constructor(
    name: string,
    args: _MemberArgs,
    opts?: CustomResourceOptions,
    defaults = {
      project: _Config.get('gcp:project'),
      member: [
        args.scope,
        args.email ? args.email : `${name}@bailey.mx`,
      ].join(':'),
    },
  ) {
    super(
      `${name}:${args.role.split('/').slice(-1)}`,
      merge(defaults, args, {
        role: args.role.includes('/')
          ? args.role
          : `roles/${args.role}`,
      }),
      opts,
    )
  }
}

export class _GroupMember extends _Member {
  constructor(
    name: string,
    args: _MemberArgs,
    opts?: CustomResourceOptions,
    defaults = {
      scope: 'group',
    },
  ) {
    super(name,
      merge(defaults, args),
      opts)
  }
}

export class _ServiceMember extends _Member {
  constructor(
    name: string,
    args: _MemberArgs,
    opts?: CustomResourceOptions,
    defaults = {
      scope: 'serviceAccount',
    },
  ) {
    super(name,
      merge(defaults, args),
      opts)
  }
}
