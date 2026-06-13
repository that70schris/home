import { Cloudflare } from '../shared/models/cloudflare/workers'
import { IAM } from '../shared/models/gcp'
import { Firebase } from './firebase'

IAM
Firebase
new Cloudflare('hostwriter', {
  accountId: 'c380083c727f97bd24c6b600d267b4c3',
  zone: 'hostwriter.app',
  www: true,
}).fetch
