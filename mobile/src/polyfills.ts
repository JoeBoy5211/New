// Polyfill WeakRef for Hermes JS engine (required by react-native-reanimated worklets runtime)
// This must be loaded before reanimated to prevent "weakref doesn't exist" crash
if (typeof global.WeakRef === 'undefined') {
  global.WeakRef = class WeakRef<T extends object> {
    private _target: T;
    constructor(target: T) {
      this._target = target;
    }
    deref(): T {
      return this._target;
    }
  } as unknown as typeof WeakRef;
}
