export function once(target: any, metadata: any): any {
  switch (metadata.kind) {
    case 'getter':
      let called = false;
      let value: any;

      metadata.access.get = function(this: any): any {
        if (!called) {
          value = metadata.access.get.call(this);
          called = true;
        }

        return value;
      };

      return target;

    default:
      throw new Error(`@once can't be used on ${target.kind} (${target.constructor.name})`);
  }
}
