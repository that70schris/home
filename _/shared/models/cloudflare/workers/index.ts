export * from './fetch'

import { WorkersCronTrigger, WorkersKvNamespace, WorkersRoute, WorkersScript } from '@pulumi/cloudflare'
import { WorkersScriptBinding } from '@pulumi/cloudflare/types/input'
import { build } from 'esbuild'
import { readFileSync } from 'fs'
import { ModuleKind, ScriptTarget, transpile } from 'typescript'
import { _Config } from '../..'
import { once } from '../../../decorators'

interface CloudflareArgs {
  accountId: string
  zone: string
  www?: boolean
  subdomains?: string[]
}

export class Cloudflare {

  constructor(
    public name: string,
    public args: CloudflareArgs,
  ) {

  }

  @once
  get $name() {
    return `${this.name.toLowerCase()}_${_Config.env}`
  }

  @once
  get host() {
    return `${_Config.subdomain}${this.args.zone}`
  }

  @once
  get environment(): WorkersScriptBinding[] {
    return [
      {
        name: 'ENVIRONMENT',
        text: this.host,
        type: 'plain_text',
      },
      {
        name: 'ZONE',
        text: this.args.zone,
        type: 'plain_text',
      },
      {
        name: 'WWW',
        text: this.args.www ? 'true' : '',
        type: 'plain_text',
      },
    ]
  }

  @once
  get namespace() {
    return new WorkersKvNamespace('experiments', {
      title: this.$name,
    })
  }

  @once
  get bindings(): WorkersScriptBinding[] {
    return [

    ]
  }

  get fetch() {
    return build({
      entryPoints: ['./shared/models/cloudflare/workers/fetch.ts'],
      loader: { '.ts': 'ts' },
      format: 'esm',
      platform: 'node',
      bundle: true,
      target: 'es2020',
      write: false,
    }).then((script) => {
      const _script = new WorkersScript(
        `${this.name}:fetch`, {
          accountId: this.args.accountId,
          scriptName: this.$name,
          mainModule: 'main',
          content: script.outputFiles[0]?.text,
          compatibilityDate: '2026-06-05',
          bindings: [
            ...this.environment,
            ...this.bindings,
          ],
        }, {
          deleteBeforeReplace: true,
        },
      );

      [ '', 'www' ]
        .concat(this.args.subdomains ?? [])
        .map((subdomain) => {
          return new URL(`https://${[
            subdomain,
            this.args.zone,
          ].filter(part => part)
            .join('.')}`)
        }).forEach((url: URL) => {
          new WorkersRoute(url.hostname, {
            zoneId: _Config.zones[this.args.zone],
            pattern: `${url.href}*`,
            script: _script.id,
          }, {
            deletedWith: _script,
            parent: _script,
          })
        })

    })
  }

  @once
  get experiments() {
    return new WorkersScript('experiments', {
      scriptName: 'experiments',
      logpush: true,
      compatibilityDate: '2026-06-05',
      content: transpile(
        readFileSync('./workers/experiments.ts').toString(), {
          module: ModuleKind.ESNext,
          target: ScriptTarget.ESNext,
        },
      ),
      bindings: [
        ...this.bindings,
        ...this.environment,
        {
          name: 'AMPLITUDE_MANAGEMENT_KEY',
          text: _Config.get('amplitude').managementKey,
          type: 'plain_text',
        },
      ],
    }, {
      dependsOn: this.namespace,
    })
  }

  @once
  get experiments_trigger() {
    return new WorkersCronTrigger('experiments', {
      scriptName: this.experiments.scriptName,
      schedules: [{
        cron: '* * * * *',
      }],
    }, {
      parent: this.experiments,
    })
  }

}
