import { DnsSplitNameservers } from '@pulumi/tailscale'

new DnsSplitNameservers('home.lab', {
  domain: 'home.lab',
  nameservers: [
    '192.168.0.1',
  ],
})
