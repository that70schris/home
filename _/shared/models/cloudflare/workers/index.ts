export * from './fetch'

import { WorkersCronTrigger, WorkersKvNamespace, WorkersRoute, WorkersScript } from '@pulumi/cloudflare'
import { WorkersScriptBinding } from '@pulumi/cloudflare/types/input'
import { build } from 'esbuild'
import { readFileSync } from 'fs'
import { ModuleKind, ScriptTarget, transpile } from 'typescript'
import { _Config } from '../..'
import { once } from '../../../decorators'

export class Cloudflare {

  @once
  static get config(): _Config | any {
    return {
      accountId: 'c380083c727f97bd24c6b600d267b4c3',
      name: 'hostwriter',
      domain: 'hostwriter.app',
      host: 'hostwriter.app',
    }
  }

  @once
  static get environment(): WorkersScriptBinding[] {
    return [
      {
        name: 'ENVIRONMENT',
        text: 'local',
        type: 'plain_text',
      },
      {
        name: 'HOST',
        text: this.config.host,
        type: 'plain_text',
      },
      {
        name: 'DOMAIN',
        text: this.config.domain,
        type: 'plain_text',
      },
    ]
  }

  @once
  static get routes() {
    return [
      '',
    ]
  }

  @once
  static get namespace() {
    return new WorkersKvNamespace('experiments', {
      title: this.$name,
    })
  }

  @once
  static get bindings(): WorkersScriptBinding[] {
    return [

    ]
  }

  @once
  static get script_urn() {
    return `${this.config?.name}:fetch`
  }

  @once
  static get $name() {
    return `${this.config?.name.toLowerCase()}_dev`
  }

  @once
  static get fetch() {
    return build({
      entryPoints: ['./shared/models/cloudflare/workers/fetch.ts'],
      loader: { '.ts': 'ts' },
      format: 'esm',
      platform: 'node',
      bundle: true,
      target: 'es2020',
      write: false,
    }).then((script) => {
      const _script = new WorkersScript(this.script_urn, {
        accountId: this.config.accountId,
        scriptName: this.$name,
        mainModule: 'main',
        content: script.outputFiles[0]?.text,
        compatibilityDate: '2026-06-05',
        bindings: [
          ...this.environment,
          ...this.bindings,
          {
            name: 'AMPLITUDE_API_KEY',
            text: '_Config.get("amplitude").apiKey',
            type: 'plain_text',
          },
        ],
      }, {
        deleteBeforeReplace: true,
      })

      this.routes.map((subdomain) => {
        return new URL(`https://${subdomain}${this.config.domain}`)
      }).forEach((url: URL) => {
        new WorkersRoute(url.hostname, {
          zoneId: _Config.zones[this.config.domain],
          script: _script.id,
          pattern: (() => {
            return `${url.href.replace(
              new RegExp(`(www.)?${this.config.domain}`),
              this.config?.host,
            )}*`
          })(),
        }, {
          parent: _script,
        })
      })

    })
  }

  @once
  static get experiments() {
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
  static get experiments_trigger() {
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
