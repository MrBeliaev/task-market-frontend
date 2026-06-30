declare const _brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [_brand]: B };

/** Lowercase 0x-prefixed Ethereum address, exactly as the backend stores it. */
export type EthAddress = Brand<`0x${string}`, 'EthAddress'>;

/** Auto-increment primary key from the task database. */
export type TaskDbId = Brand<number, 'TaskDbId'>;
