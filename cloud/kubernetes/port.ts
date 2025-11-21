import { input } from '@pulumi/kubernetes/types';
import { Input } from '@pulumi/pulumi';
import { merge } from 'lodash';

import { once } from '../../shared/decorators';

interface PortNumbers {
  container: Input<number>
  service?: Input<number>
}

export class Port {

  constructor(
    public name: string,
    public numbers: PortNumbers,
    private defaults = { service: numbers.container },
  ) {
    this.numbers = merge(
      defaults,
      numbers,
    );
  }

  @once
  get service(): input.core.v1.ServicePort | null {
    return this.numbers.service
      ? {
          name: this.name,
          port: this.numbers.service,
          targetPort: this.numbers.container,
        }
      : null;
  }

  @once
  get container(): input.core.v1.ContainerPort {
    return {
      name: this.name,
      containerPort: this.numbers.container,
    };
  }

}
