export function once(target: any, context: ClassFieldDecoratorContext): any {
  switch (context.kind as string) {
    case 'getter':
      return function(this: any) {
        Object.defineProperty(this, context.name, {
          value: target.call(this),
        });

        return this[context.name];
      };

    default:
      throw new Error(`@once can't be used with ${context.kind} (${target.constructor.name}.${context.name.toString()})`);
  }
}
