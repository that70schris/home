export * from './fetch'

import { Worker, WorkersCronTrigger, WorkersKvNamespace, WorkersRoute, WorkersScript, WorkerVersion } from '@pulumi/cloudflare'
import { WorkerScriptBinding } from '@pulumi/cloudflare/types/input'
import { Config } from '@pulumi/pulumi'
import { build } from 'esbuild'
import { readFileSync } from 'fs'
import { ModuleKind, ScriptTarget, transpile } from 'typescript'
import { _Config } from '../../shared'
import { once } from '../../shared/decorators'

export class Cloudflare {

  @once
  static get config(): _Config | undefined {
    return
  }

  @once
  static get environment(): WorkerScriptBinding[] {
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
      'www.',
    ]
  }

  @once
  static get namespace() {
    return new WorkersKvNamespace('experiments', {
      accountId: this.config.accountId,
      title: this.$name,
    })
  }

  @once
  static get bindings(): WorkerScriptBinding[] {
    return []
  }

  @once
  static get script_urn() {
    return `${this.config.name}:request`
  }

  @once
  static get $name() {
    return `${this.config.name.toLowerCase()}_${this.config.env}`
  }

  @once
  static get request_worker() {
    return build({
      entryPoints: ['./workers/request.ts'],
      loader: { '.ts': 'ts' },
      format: 'esm',
      platform: 'node',
      bundle: true,
      target: 'es2020',
      outfile: './workers/dist/request.js',
      write: false,
    }).then(() => {
      const worker = new Worker(this.script_urn, {
        accountId: this.config.accountId,
        name: this.$name,
        logpush: true,
      })

      const script = new WorkerVersion(this.script_urn, {
        accountId: this.config.accountId,
        workerId: worker.id,
        mainModule: 'main',
        modules: [
          {
            name: 'main',
            contentType: 'application/javascript',
            contentFile: './workers/dist/request.js',
          },
        ],
        compatibilityDate: '2024-12-05',
        compatibilityFlags: [
          'nodejs_compat_v2',
        ],
        bindings: [
          ...this.environment,
          ...this.bindings,
          {
            name: 'AMPLITUDE_API_KEY',
            text: new Config('amplitude').get('apiKey'),
            type: 'plain_text',
          },
        ],
      }, {
        deleteBeforeReplace: true,
      })

      this.routes.map((subdomain) => {
        return new URL(`https://${subdomain}${this.config.domain}`)
      }).forEach((url) => {
        new WorkersRoute(url.hostname, {
          zoneId: this.config.zoneId,
          script: script.id,
          pattern: (() => {
            return `${url.href.replace(
              new RegExp(this.config.domain),
              this.config.host,
            )}*`
          })(),
        }, {
          parent: script,
        })
      })
    })
  }

  @once
  static get experiments_worker() {
    return new WorkersScript('experiments', {
      accountId: this.config.accountId,
      scriptName: `experiments_${this.config.env}`,
      logpush: true,
      // module: true,
      compatibilityDate: '2024-09-23',
      compatibilityFlags: [
        'nodejs_compat_v2',
      ],
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
          text: new Config('amplitude').get('managementAPIKey'),
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
      accountId: this.config.accountId,
      scriptName: this.experiments_worker.scriptName,
      schedules: [{
        cron: '* * * * *',
      }],
    }, {
      parent: this.experiments_worker,
    })
  }

}
