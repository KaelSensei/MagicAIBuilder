
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Deck
 * A Commander (or Brawl) deck with its metadata
 */
export type Deck = $Result.DefaultSelection<Prisma.$DeckPayload>
/**
 * Model DeckCard
 * Individual card entry in a deck (the 99 + commanders)
 */
export type DeckCard = $Result.DefaultSelection<Prisma.$DeckCardPayload>
/**
 * Model CardCache
 * Server-side cache for Scryfall card data (TTL: 24h)
 */
export type CardCache = $Result.DefaultSelection<Prisma.$CardCachePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Decks
 * const decks = await prisma.deck.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Decks
   * const decks = await prisma.deck.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.deck`: Exposes CRUD operations for the **Deck** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Decks
    * const decks = await prisma.deck.findMany()
    * ```
    */
  get deck(): Prisma.DeckDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.deckCard`: Exposes CRUD operations for the **DeckCard** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DeckCards
    * const deckCards = await prisma.deckCard.findMany()
    * ```
    */
  get deckCard(): Prisma.DeckCardDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.cardCache`: Exposes CRUD operations for the **CardCache** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CardCaches
    * const cardCaches = await prisma.cardCache.findMany()
    * ```
    */
  get cardCache(): Prisma.CardCacheDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.5.0
   * Query Engine version: 280c870be64f457428992c43c1f6d557fab6e29e
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Deck: 'Deck',
    DeckCard: 'DeckCard',
    CardCache: 'CardCache'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "deck" | "deckCard" | "cardCache"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Deck: {
        payload: Prisma.$DeckPayload<ExtArgs>
        fields: Prisma.DeckFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DeckFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DeckFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>
          }
          findFirst: {
            args: Prisma.DeckFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DeckFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>
          }
          findMany: {
            args: Prisma.DeckFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>[]
          }
          create: {
            args: Prisma.DeckCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>
          }
          createMany: {
            args: Prisma.DeckCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DeckCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>[]
          }
          delete: {
            args: Prisma.DeckDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>
          }
          update: {
            args: Prisma.DeckUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>
          }
          deleteMany: {
            args: Prisma.DeckDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DeckUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DeckUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>[]
          }
          upsert: {
            args: Prisma.DeckUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckPayload>
          }
          aggregate: {
            args: Prisma.DeckAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDeck>
          }
          groupBy: {
            args: Prisma.DeckGroupByArgs<ExtArgs>
            result: $Utils.Optional<DeckGroupByOutputType>[]
          }
          count: {
            args: Prisma.DeckCountArgs<ExtArgs>
            result: $Utils.Optional<DeckCountAggregateOutputType> | number
          }
        }
      }
      DeckCard: {
        payload: Prisma.$DeckCardPayload<ExtArgs>
        fields: Prisma.DeckCardFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DeckCardFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DeckCardFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>
          }
          findFirst: {
            args: Prisma.DeckCardFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DeckCardFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>
          }
          findMany: {
            args: Prisma.DeckCardFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>[]
          }
          create: {
            args: Prisma.DeckCardCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>
          }
          createMany: {
            args: Prisma.DeckCardCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DeckCardCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>[]
          }
          delete: {
            args: Prisma.DeckCardDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>
          }
          update: {
            args: Prisma.DeckCardUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>
          }
          deleteMany: {
            args: Prisma.DeckCardDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DeckCardUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DeckCardUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>[]
          }
          upsert: {
            args: Prisma.DeckCardUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeckCardPayload>
          }
          aggregate: {
            args: Prisma.DeckCardAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDeckCard>
          }
          groupBy: {
            args: Prisma.DeckCardGroupByArgs<ExtArgs>
            result: $Utils.Optional<DeckCardGroupByOutputType>[]
          }
          count: {
            args: Prisma.DeckCardCountArgs<ExtArgs>
            result: $Utils.Optional<DeckCardCountAggregateOutputType> | number
          }
        }
      }
      CardCache: {
        payload: Prisma.$CardCachePayload<ExtArgs>
        fields: Prisma.CardCacheFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CardCacheFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CardCacheFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>
          }
          findFirst: {
            args: Prisma.CardCacheFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CardCacheFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>
          }
          findMany: {
            args: Prisma.CardCacheFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>[]
          }
          create: {
            args: Prisma.CardCacheCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>
          }
          createMany: {
            args: Prisma.CardCacheCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CardCacheCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>[]
          }
          delete: {
            args: Prisma.CardCacheDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>
          }
          update: {
            args: Prisma.CardCacheUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>
          }
          deleteMany: {
            args: Prisma.CardCacheDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CardCacheUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CardCacheUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>[]
          }
          upsert: {
            args: Prisma.CardCacheUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CardCachePayload>
          }
          aggregate: {
            args: Prisma.CardCacheAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCardCache>
          }
          groupBy: {
            args: Prisma.CardCacheGroupByArgs<ExtArgs>
            result: $Utils.Optional<CardCacheGroupByOutputType>[]
          }
          count: {
            args: Prisma.CardCacheCountArgs<ExtArgs>
            result: $Utils.Optional<CardCacheCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    deck?: DeckOmit
    deckCard?: DeckCardOmit
    cardCache?: CardCacheOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type DeckCountOutputType
   */

  export type DeckCountOutputType = {
    cards: number
  }

  export type DeckCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cards?: boolean | DeckCountOutputTypeCountCardsArgs
  }

  // Custom InputTypes
  /**
   * DeckCountOutputType without action
   */
  export type DeckCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCountOutputType
     */
    select?: DeckCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DeckCountOutputType without action
   */
  export type DeckCountOutputTypeCountCardsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeckCardWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Deck
   */

  export type AggregateDeck = {
    _count: DeckCountAggregateOutputType | null
    _avg: DeckAvgAggregateOutputType | null
    _sum: DeckSumAggregateOutputType | null
    _min: DeckMinAggregateOutputType | null
    _max: DeckMaxAggregateOutputType | null
  }

  export type DeckAvgAggregateOutputType = {
    targetBracket: number | null
    budget: number | null
  }

  export type DeckSumAggregateOutputType = {
    targetBracket: number | null
    budget: number | null
  }

  export type DeckMinAggregateOutputType = {
    id: string | null
    name: string | null
    format: string | null
    targetBracket: number | null
    budget: number | null
    commanderId: string | null
    partnerId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DeckMaxAggregateOutputType = {
    id: string | null
    name: string | null
    format: string | null
    targetBracket: number | null
    budget: number | null
    commanderId: string | null
    partnerId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DeckCountAggregateOutputType = {
    id: number
    name: number
    format: number
    targetBracket: number
    budget: number
    commanderId: number
    partnerId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DeckAvgAggregateInputType = {
    targetBracket?: true
    budget?: true
  }

  export type DeckSumAggregateInputType = {
    targetBracket?: true
    budget?: true
  }

  export type DeckMinAggregateInputType = {
    id?: true
    name?: true
    format?: true
    targetBracket?: true
    budget?: true
    commanderId?: true
    partnerId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DeckMaxAggregateInputType = {
    id?: true
    name?: true
    format?: true
    targetBracket?: true
    budget?: true
    commanderId?: true
    partnerId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DeckCountAggregateInputType = {
    id?: true
    name?: true
    format?: true
    targetBracket?: true
    budget?: true
    commanderId?: true
    partnerId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DeckAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Deck to aggregate.
     */
    where?: DeckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Decks to fetch.
     */
    orderBy?: DeckOrderByWithRelationInput | DeckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DeckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Decks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Decks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Decks
    **/
    _count?: true | DeckCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DeckAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DeckSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DeckMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DeckMaxAggregateInputType
  }

  export type GetDeckAggregateType<T extends DeckAggregateArgs> = {
        [P in keyof T & keyof AggregateDeck]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDeck[P]>
      : GetScalarType<T[P], AggregateDeck[P]>
  }




  export type DeckGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeckWhereInput
    orderBy?: DeckOrderByWithAggregationInput | DeckOrderByWithAggregationInput[]
    by: DeckScalarFieldEnum[] | DeckScalarFieldEnum
    having?: DeckScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DeckCountAggregateInputType | true
    _avg?: DeckAvgAggregateInputType
    _sum?: DeckSumAggregateInputType
    _min?: DeckMinAggregateInputType
    _max?: DeckMaxAggregateInputType
  }

  export type DeckGroupByOutputType = {
    id: string
    name: string
    format: string
    targetBracket: number
    budget: number | null
    commanderId: string | null
    partnerId: string | null
    createdAt: Date
    updatedAt: Date
    _count: DeckCountAggregateOutputType | null
    _avg: DeckAvgAggregateOutputType | null
    _sum: DeckSumAggregateOutputType | null
    _min: DeckMinAggregateOutputType | null
    _max: DeckMaxAggregateOutputType | null
  }

  type GetDeckGroupByPayload<T extends DeckGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DeckGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DeckGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DeckGroupByOutputType[P]>
            : GetScalarType<T[P], DeckGroupByOutputType[P]>
        }
      >
    >


  export type DeckSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    format?: boolean
    targetBracket?: boolean
    budget?: boolean
    commanderId?: boolean
    partnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    cards?: boolean | Deck$cardsArgs<ExtArgs>
    _count?: boolean | DeckCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deck"]>

  export type DeckSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    format?: boolean
    targetBracket?: boolean
    budget?: boolean
    commanderId?: boolean
    partnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["deck"]>

  export type DeckSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    format?: boolean
    targetBracket?: boolean
    budget?: boolean
    commanderId?: boolean
    partnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["deck"]>

  export type DeckSelectScalar = {
    id?: boolean
    name?: boolean
    format?: boolean
    targetBracket?: boolean
    budget?: boolean
    commanderId?: boolean
    partnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DeckOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "format" | "targetBracket" | "budget" | "commanderId" | "partnerId" | "createdAt" | "updatedAt", ExtArgs["result"]["deck"]>
  export type DeckInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cards?: boolean | Deck$cardsArgs<ExtArgs>
    _count?: boolean | DeckCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DeckIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type DeckIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DeckPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Deck"
    objects: {
      cards: Prisma.$DeckCardPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      format: string
      targetBracket: number
      budget: number | null
      /**
       * Scryfall ID of the commander card
       */
      commanderId: string | null
      /**
       * Scryfall ID of the partner card (optional)
       */
      partnerId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["deck"]>
    composites: {}
  }

  type DeckGetPayload<S extends boolean | null | undefined | DeckDefaultArgs> = $Result.GetResult<Prisma.$DeckPayload, S>

  type DeckCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DeckFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DeckCountAggregateInputType | true
    }

  export interface DeckDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Deck'], meta: { name: 'Deck' } }
    /**
     * Find zero or one Deck that matches the filter.
     * @param {DeckFindUniqueArgs} args - Arguments to find a Deck
     * @example
     * // Get one Deck
     * const deck = await prisma.deck.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DeckFindUniqueArgs>(args: SelectSubset<T, DeckFindUniqueArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Deck that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DeckFindUniqueOrThrowArgs} args - Arguments to find a Deck
     * @example
     * // Get one Deck
     * const deck = await prisma.deck.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DeckFindUniqueOrThrowArgs>(args: SelectSubset<T, DeckFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Deck that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckFindFirstArgs} args - Arguments to find a Deck
     * @example
     * // Get one Deck
     * const deck = await prisma.deck.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DeckFindFirstArgs>(args?: SelectSubset<T, DeckFindFirstArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Deck that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckFindFirstOrThrowArgs} args - Arguments to find a Deck
     * @example
     * // Get one Deck
     * const deck = await prisma.deck.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DeckFindFirstOrThrowArgs>(args?: SelectSubset<T, DeckFindFirstOrThrowArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Decks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Decks
     * const decks = await prisma.deck.findMany()
     * 
     * // Get first 10 Decks
     * const decks = await prisma.deck.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const deckWithIdOnly = await prisma.deck.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DeckFindManyArgs>(args?: SelectSubset<T, DeckFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Deck.
     * @param {DeckCreateArgs} args - Arguments to create a Deck.
     * @example
     * // Create one Deck
     * const Deck = await prisma.deck.create({
     *   data: {
     *     // ... data to create a Deck
     *   }
     * })
     * 
     */
    create<T extends DeckCreateArgs>(args: SelectSubset<T, DeckCreateArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Decks.
     * @param {DeckCreateManyArgs} args - Arguments to create many Decks.
     * @example
     * // Create many Decks
     * const deck = await prisma.deck.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DeckCreateManyArgs>(args?: SelectSubset<T, DeckCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Decks and returns the data saved in the database.
     * @param {DeckCreateManyAndReturnArgs} args - Arguments to create many Decks.
     * @example
     * // Create many Decks
     * const deck = await prisma.deck.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Decks and only return the `id`
     * const deckWithIdOnly = await prisma.deck.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DeckCreateManyAndReturnArgs>(args?: SelectSubset<T, DeckCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Deck.
     * @param {DeckDeleteArgs} args - Arguments to delete one Deck.
     * @example
     * // Delete one Deck
     * const Deck = await prisma.deck.delete({
     *   where: {
     *     // ... filter to delete one Deck
     *   }
     * })
     * 
     */
    delete<T extends DeckDeleteArgs>(args: SelectSubset<T, DeckDeleteArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Deck.
     * @param {DeckUpdateArgs} args - Arguments to update one Deck.
     * @example
     * // Update one Deck
     * const deck = await prisma.deck.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DeckUpdateArgs>(args: SelectSubset<T, DeckUpdateArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Decks.
     * @param {DeckDeleteManyArgs} args - Arguments to filter Decks to delete.
     * @example
     * // Delete a few Decks
     * const { count } = await prisma.deck.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DeckDeleteManyArgs>(args?: SelectSubset<T, DeckDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Decks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Decks
     * const deck = await prisma.deck.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DeckUpdateManyArgs>(args: SelectSubset<T, DeckUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Decks and returns the data updated in the database.
     * @param {DeckUpdateManyAndReturnArgs} args - Arguments to update many Decks.
     * @example
     * // Update many Decks
     * const deck = await prisma.deck.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Decks and only return the `id`
     * const deckWithIdOnly = await prisma.deck.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DeckUpdateManyAndReturnArgs>(args: SelectSubset<T, DeckUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Deck.
     * @param {DeckUpsertArgs} args - Arguments to update or create a Deck.
     * @example
     * // Update or create a Deck
     * const deck = await prisma.deck.upsert({
     *   create: {
     *     // ... data to create a Deck
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Deck we want to update
     *   }
     * })
     */
    upsert<T extends DeckUpsertArgs>(args: SelectSubset<T, DeckUpsertArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Decks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCountArgs} args - Arguments to filter Decks to count.
     * @example
     * // Count the number of Decks
     * const count = await prisma.deck.count({
     *   where: {
     *     // ... the filter for the Decks we want to count
     *   }
     * })
    **/
    count<T extends DeckCountArgs>(
      args?: Subset<T, DeckCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DeckCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Deck.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DeckAggregateArgs>(args: Subset<T, DeckAggregateArgs>): Prisma.PrismaPromise<GetDeckAggregateType<T>>

    /**
     * Group by Deck.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DeckGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DeckGroupByArgs['orderBy'] }
        : { orderBy?: DeckGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DeckGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeckGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Deck model
   */
  readonly fields: DeckFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Deck.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DeckClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    cards<T extends Deck$cardsArgs<ExtArgs> = {}>(args?: Subset<T, Deck$cardsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Deck model
   */
  interface DeckFieldRefs {
    readonly id: FieldRef<"Deck", 'String'>
    readonly name: FieldRef<"Deck", 'String'>
    readonly format: FieldRef<"Deck", 'String'>
    readonly targetBracket: FieldRef<"Deck", 'Int'>
    readonly budget: FieldRef<"Deck", 'Float'>
    readonly commanderId: FieldRef<"Deck", 'String'>
    readonly partnerId: FieldRef<"Deck", 'String'>
    readonly createdAt: FieldRef<"Deck", 'DateTime'>
    readonly updatedAt: FieldRef<"Deck", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Deck findUnique
   */
  export type DeckFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * Filter, which Deck to fetch.
     */
    where: DeckWhereUniqueInput
  }

  /**
   * Deck findUniqueOrThrow
   */
  export type DeckFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * Filter, which Deck to fetch.
     */
    where: DeckWhereUniqueInput
  }

  /**
   * Deck findFirst
   */
  export type DeckFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * Filter, which Deck to fetch.
     */
    where?: DeckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Decks to fetch.
     */
    orderBy?: DeckOrderByWithRelationInput | DeckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Decks.
     */
    cursor?: DeckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Decks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Decks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Decks.
     */
    distinct?: DeckScalarFieldEnum | DeckScalarFieldEnum[]
  }

  /**
   * Deck findFirstOrThrow
   */
  export type DeckFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * Filter, which Deck to fetch.
     */
    where?: DeckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Decks to fetch.
     */
    orderBy?: DeckOrderByWithRelationInput | DeckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Decks.
     */
    cursor?: DeckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Decks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Decks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Decks.
     */
    distinct?: DeckScalarFieldEnum | DeckScalarFieldEnum[]
  }

  /**
   * Deck findMany
   */
  export type DeckFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * Filter, which Decks to fetch.
     */
    where?: DeckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Decks to fetch.
     */
    orderBy?: DeckOrderByWithRelationInput | DeckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Decks.
     */
    cursor?: DeckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Decks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Decks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Decks.
     */
    distinct?: DeckScalarFieldEnum | DeckScalarFieldEnum[]
  }

  /**
   * Deck create
   */
  export type DeckCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * The data needed to create a Deck.
     */
    data: XOR<DeckCreateInput, DeckUncheckedCreateInput>
  }

  /**
   * Deck createMany
   */
  export type DeckCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Decks.
     */
    data: DeckCreateManyInput | DeckCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Deck createManyAndReturn
   */
  export type DeckCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * The data used to create many Decks.
     */
    data: DeckCreateManyInput | DeckCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Deck update
   */
  export type DeckUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * The data needed to update a Deck.
     */
    data: XOR<DeckUpdateInput, DeckUncheckedUpdateInput>
    /**
     * Choose, which Deck to update.
     */
    where: DeckWhereUniqueInput
  }

  /**
   * Deck updateMany
   */
  export type DeckUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Decks.
     */
    data: XOR<DeckUpdateManyMutationInput, DeckUncheckedUpdateManyInput>
    /**
     * Filter which Decks to update
     */
    where?: DeckWhereInput
    /**
     * Limit how many Decks to update.
     */
    limit?: number
  }

  /**
   * Deck updateManyAndReturn
   */
  export type DeckUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * The data used to update Decks.
     */
    data: XOR<DeckUpdateManyMutationInput, DeckUncheckedUpdateManyInput>
    /**
     * Filter which Decks to update
     */
    where?: DeckWhereInput
    /**
     * Limit how many Decks to update.
     */
    limit?: number
  }

  /**
   * Deck upsert
   */
  export type DeckUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * The filter to search for the Deck to update in case it exists.
     */
    where: DeckWhereUniqueInput
    /**
     * In case the Deck found by the `where` argument doesn't exist, create a new Deck with this data.
     */
    create: XOR<DeckCreateInput, DeckUncheckedCreateInput>
    /**
     * In case the Deck was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DeckUpdateInput, DeckUncheckedUpdateInput>
  }

  /**
   * Deck delete
   */
  export type DeckDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
    /**
     * Filter which Deck to delete.
     */
    where: DeckWhereUniqueInput
  }

  /**
   * Deck deleteMany
   */
  export type DeckDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Decks to delete
     */
    where?: DeckWhereInput
    /**
     * Limit how many Decks to delete.
     */
    limit?: number
  }

  /**
   * Deck.cards
   */
  export type Deck$cardsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    where?: DeckCardWhereInput
    orderBy?: DeckCardOrderByWithRelationInput | DeckCardOrderByWithRelationInput[]
    cursor?: DeckCardWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DeckCardScalarFieldEnum | DeckCardScalarFieldEnum[]
  }

  /**
   * Deck without action
   */
  export type DeckDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deck
     */
    select?: DeckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deck
     */
    omit?: DeckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckInclude<ExtArgs> | null
  }


  /**
   * Model DeckCard
   */

  export type AggregateDeckCard = {
    _count: DeckCardCountAggregateOutputType | null
    _avg: DeckCardAvgAggregateOutputType | null
    _sum: DeckCardSumAggregateOutputType | null
    _min: DeckCardMinAggregateOutputType | null
    _max: DeckCardMaxAggregateOutputType | null
  }

  export type DeckCardAvgAggregateOutputType = {
    cmc: number | null
    price: number | null
    quantity: number | null
  }

  export type DeckCardSumAggregateOutputType = {
    cmc: number | null
    price: number | null
    quantity: number | null
  }

  export type DeckCardMinAggregateOutputType = {
    id: string | null
    deckId: string | null
    scryfallId: string | null
    name: string | null
    manaCost: string | null
    cmc: number | null
    typeLine: string | null
    oracleText: string | null
    isGameChanger: boolean | null
    isBanned: boolean | null
    price: number | null
    imageUri: string | null
    artCropUri: string | null
    category: string | null
    quantity: number | null
    isCommander: boolean | null
    isPartner: boolean | null
  }

  export type DeckCardMaxAggregateOutputType = {
    id: string | null
    deckId: string | null
    scryfallId: string | null
    name: string | null
    manaCost: string | null
    cmc: number | null
    typeLine: string | null
    oracleText: string | null
    isGameChanger: boolean | null
    isBanned: boolean | null
    price: number | null
    imageUri: string | null
    artCropUri: string | null
    category: string | null
    quantity: number | null
    isCommander: boolean | null
    isPartner: boolean | null
  }

  export type DeckCardCountAggregateOutputType = {
    id: number
    deckId: number
    scryfallId: number
    name: number
    manaCost: number
    cmc: number
    typeLine: number
    oracleText: number
    colorIdentity: number
    isGameChanger: number
    isBanned: number
    price: number
    imageUri: number
    artCropUri: number
    category: number
    quantity: number
    isCommander: number
    isPartner: number
    _all: number
  }


  export type DeckCardAvgAggregateInputType = {
    cmc?: true
    price?: true
    quantity?: true
  }

  export type DeckCardSumAggregateInputType = {
    cmc?: true
    price?: true
    quantity?: true
  }

  export type DeckCardMinAggregateInputType = {
    id?: true
    deckId?: true
    scryfallId?: true
    name?: true
    manaCost?: true
    cmc?: true
    typeLine?: true
    oracleText?: true
    isGameChanger?: true
    isBanned?: true
    price?: true
    imageUri?: true
    artCropUri?: true
    category?: true
    quantity?: true
    isCommander?: true
    isPartner?: true
  }

  export type DeckCardMaxAggregateInputType = {
    id?: true
    deckId?: true
    scryfallId?: true
    name?: true
    manaCost?: true
    cmc?: true
    typeLine?: true
    oracleText?: true
    isGameChanger?: true
    isBanned?: true
    price?: true
    imageUri?: true
    artCropUri?: true
    category?: true
    quantity?: true
    isCommander?: true
    isPartner?: true
  }

  export type DeckCardCountAggregateInputType = {
    id?: true
    deckId?: true
    scryfallId?: true
    name?: true
    manaCost?: true
    cmc?: true
    typeLine?: true
    oracleText?: true
    colorIdentity?: true
    isGameChanger?: true
    isBanned?: true
    price?: true
    imageUri?: true
    artCropUri?: true
    category?: true
    quantity?: true
    isCommander?: true
    isPartner?: true
    _all?: true
  }

  export type DeckCardAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeckCard to aggregate.
     */
    where?: DeckCardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeckCards to fetch.
     */
    orderBy?: DeckCardOrderByWithRelationInput | DeckCardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DeckCardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeckCards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeckCards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DeckCards
    **/
    _count?: true | DeckCardCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DeckCardAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DeckCardSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DeckCardMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DeckCardMaxAggregateInputType
  }

  export type GetDeckCardAggregateType<T extends DeckCardAggregateArgs> = {
        [P in keyof T & keyof AggregateDeckCard]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDeckCard[P]>
      : GetScalarType<T[P], AggregateDeckCard[P]>
  }




  export type DeckCardGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeckCardWhereInput
    orderBy?: DeckCardOrderByWithAggregationInput | DeckCardOrderByWithAggregationInput[]
    by: DeckCardScalarFieldEnum[] | DeckCardScalarFieldEnum
    having?: DeckCardScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DeckCardCountAggregateInputType | true
    _avg?: DeckCardAvgAggregateInputType
    _sum?: DeckCardSumAggregateInputType
    _min?: DeckCardMinAggregateInputType
    _max?: DeckCardMaxAggregateInputType
  }

  export type DeckCardGroupByOutputType = {
    id: string
    deckId: string
    scryfallId: string
    name: string
    manaCost: string
    cmc: number
    typeLine: string
    oracleText: string
    colorIdentity: string[]
    isGameChanger: boolean
    isBanned: boolean
    price: number | null
    imageUri: string
    artCropUri: string
    category: string
    quantity: number
    isCommander: boolean
    isPartner: boolean
    _count: DeckCardCountAggregateOutputType | null
    _avg: DeckCardAvgAggregateOutputType | null
    _sum: DeckCardSumAggregateOutputType | null
    _min: DeckCardMinAggregateOutputType | null
    _max: DeckCardMaxAggregateOutputType | null
  }

  type GetDeckCardGroupByPayload<T extends DeckCardGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DeckCardGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DeckCardGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DeckCardGroupByOutputType[P]>
            : GetScalarType<T[P], DeckCardGroupByOutputType[P]>
        }
      >
    >


  export type DeckCardSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    deckId?: boolean
    scryfallId?: boolean
    name?: boolean
    manaCost?: boolean
    cmc?: boolean
    typeLine?: boolean
    oracleText?: boolean
    colorIdentity?: boolean
    isGameChanger?: boolean
    isBanned?: boolean
    price?: boolean
    imageUri?: boolean
    artCropUri?: boolean
    category?: boolean
    quantity?: boolean
    isCommander?: boolean
    isPartner?: boolean
    deck?: boolean | DeckDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deckCard"]>

  export type DeckCardSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    deckId?: boolean
    scryfallId?: boolean
    name?: boolean
    manaCost?: boolean
    cmc?: boolean
    typeLine?: boolean
    oracleText?: boolean
    colorIdentity?: boolean
    isGameChanger?: boolean
    isBanned?: boolean
    price?: boolean
    imageUri?: boolean
    artCropUri?: boolean
    category?: boolean
    quantity?: boolean
    isCommander?: boolean
    isPartner?: boolean
    deck?: boolean | DeckDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deckCard"]>

  export type DeckCardSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    deckId?: boolean
    scryfallId?: boolean
    name?: boolean
    manaCost?: boolean
    cmc?: boolean
    typeLine?: boolean
    oracleText?: boolean
    colorIdentity?: boolean
    isGameChanger?: boolean
    isBanned?: boolean
    price?: boolean
    imageUri?: boolean
    artCropUri?: boolean
    category?: boolean
    quantity?: boolean
    isCommander?: boolean
    isPartner?: boolean
    deck?: boolean | DeckDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deckCard"]>

  export type DeckCardSelectScalar = {
    id?: boolean
    deckId?: boolean
    scryfallId?: boolean
    name?: boolean
    manaCost?: boolean
    cmc?: boolean
    typeLine?: boolean
    oracleText?: boolean
    colorIdentity?: boolean
    isGameChanger?: boolean
    isBanned?: boolean
    price?: boolean
    imageUri?: boolean
    artCropUri?: boolean
    category?: boolean
    quantity?: boolean
    isCommander?: boolean
    isPartner?: boolean
  }

  export type DeckCardOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "deckId" | "scryfallId" | "name" | "manaCost" | "cmc" | "typeLine" | "oracleText" | "colorIdentity" | "isGameChanger" | "isBanned" | "price" | "imageUri" | "artCropUri" | "category" | "quantity" | "isCommander" | "isPartner", ExtArgs["result"]["deckCard"]>
  export type DeckCardInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deck?: boolean | DeckDefaultArgs<ExtArgs>
  }
  export type DeckCardIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deck?: boolean | DeckDefaultArgs<ExtArgs>
  }
  export type DeckCardIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deck?: boolean | DeckDefaultArgs<ExtArgs>
  }

  export type $DeckCardPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DeckCard"
    objects: {
      deck: Prisma.$DeckPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      deckId: string
      scryfallId: string
      name: string
      manaCost: string
      cmc: number
      typeLine: string
      oracleText: string
      colorIdentity: string[]
      isGameChanger: boolean
      isBanned: boolean
      price: number | null
      imageUri: string
      artCropUri: string
      category: string
      quantity: number
      isCommander: boolean
      isPartner: boolean
    }, ExtArgs["result"]["deckCard"]>
    composites: {}
  }

  type DeckCardGetPayload<S extends boolean | null | undefined | DeckCardDefaultArgs> = $Result.GetResult<Prisma.$DeckCardPayload, S>

  type DeckCardCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DeckCardFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DeckCardCountAggregateInputType | true
    }

  export interface DeckCardDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DeckCard'], meta: { name: 'DeckCard' } }
    /**
     * Find zero or one DeckCard that matches the filter.
     * @param {DeckCardFindUniqueArgs} args - Arguments to find a DeckCard
     * @example
     * // Get one DeckCard
     * const deckCard = await prisma.deckCard.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DeckCardFindUniqueArgs>(args: SelectSubset<T, DeckCardFindUniqueArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DeckCard that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DeckCardFindUniqueOrThrowArgs} args - Arguments to find a DeckCard
     * @example
     * // Get one DeckCard
     * const deckCard = await prisma.deckCard.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DeckCardFindUniqueOrThrowArgs>(args: SelectSubset<T, DeckCardFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DeckCard that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardFindFirstArgs} args - Arguments to find a DeckCard
     * @example
     * // Get one DeckCard
     * const deckCard = await prisma.deckCard.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DeckCardFindFirstArgs>(args?: SelectSubset<T, DeckCardFindFirstArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DeckCard that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardFindFirstOrThrowArgs} args - Arguments to find a DeckCard
     * @example
     * // Get one DeckCard
     * const deckCard = await prisma.deckCard.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DeckCardFindFirstOrThrowArgs>(args?: SelectSubset<T, DeckCardFindFirstOrThrowArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DeckCards that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DeckCards
     * const deckCards = await prisma.deckCard.findMany()
     * 
     * // Get first 10 DeckCards
     * const deckCards = await prisma.deckCard.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const deckCardWithIdOnly = await prisma.deckCard.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DeckCardFindManyArgs>(args?: SelectSubset<T, DeckCardFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DeckCard.
     * @param {DeckCardCreateArgs} args - Arguments to create a DeckCard.
     * @example
     * // Create one DeckCard
     * const DeckCard = await prisma.deckCard.create({
     *   data: {
     *     // ... data to create a DeckCard
     *   }
     * })
     * 
     */
    create<T extends DeckCardCreateArgs>(args: SelectSubset<T, DeckCardCreateArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DeckCards.
     * @param {DeckCardCreateManyArgs} args - Arguments to create many DeckCards.
     * @example
     * // Create many DeckCards
     * const deckCard = await prisma.deckCard.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DeckCardCreateManyArgs>(args?: SelectSubset<T, DeckCardCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DeckCards and returns the data saved in the database.
     * @param {DeckCardCreateManyAndReturnArgs} args - Arguments to create many DeckCards.
     * @example
     * // Create many DeckCards
     * const deckCard = await prisma.deckCard.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DeckCards and only return the `id`
     * const deckCardWithIdOnly = await prisma.deckCard.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DeckCardCreateManyAndReturnArgs>(args?: SelectSubset<T, DeckCardCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DeckCard.
     * @param {DeckCardDeleteArgs} args - Arguments to delete one DeckCard.
     * @example
     * // Delete one DeckCard
     * const DeckCard = await prisma.deckCard.delete({
     *   where: {
     *     // ... filter to delete one DeckCard
     *   }
     * })
     * 
     */
    delete<T extends DeckCardDeleteArgs>(args: SelectSubset<T, DeckCardDeleteArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DeckCard.
     * @param {DeckCardUpdateArgs} args - Arguments to update one DeckCard.
     * @example
     * // Update one DeckCard
     * const deckCard = await prisma.deckCard.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DeckCardUpdateArgs>(args: SelectSubset<T, DeckCardUpdateArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DeckCards.
     * @param {DeckCardDeleteManyArgs} args - Arguments to filter DeckCards to delete.
     * @example
     * // Delete a few DeckCards
     * const { count } = await prisma.deckCard.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DeckCardDeleteManyArgs>(args?: SelectSubset<T, DeckCardDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeckCards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DeckCards
     * const deckCard = await prisma.deckCard.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DeckCardUpdateManyArgs>(args: SelectSubset<T, DeckCardUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeckCards and returns the data updated in the database.
     * @param {DeckCardUpdateManyAndReturnArgs} args - Arguments to update many DeckCards.
     * @example
     * // Update many DeckCards
     * const deckCard = await prisma.deckCard.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DeckCards and only return the `id`
     * const deckCardWithIdOnly = await prisma.deckCard.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DeckCardUpdateManyAndReturnArgs>(args: SelectSubset<T, DeckCardUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DeckCard.
     * @param {DeckCardUpsertArgs} args - Arguments to update or create a DeckCard.
     * @example
     * // Update or create a DeckCard
     * const deckCard = await prisma.deckCard.upsert({
     *   create: {
     *     // ... data to create a DeckCard
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DeckCard we want to update
     *   }
     * })
     */
    upsert<T extends DeckCardUpsertArgs>(args: SelectSubset<T, DeckCardUpsertArgs<ExtArgs>>): Prisma__DeckCardClient<$Result.GetResult<Prisma.$DeckCardPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DeckCards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardCountArgs} args - Arguments to filter DeckCards to count.
     * @example
     * // Count the number of DeckCards
     * const count = await prisma.deckCard.count({
     *   where: {
     *     // ... the filter for the DeckCards we want to count
     *   }
     * })
    **/
    count<T extends DeckCardCountArgs>(
      args?: Subset<T, DeckCardCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DeckCardCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DeckCard.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DeckCardAggregateArgs>(args: Subset<T, DeckCardAggregateArgs>): Prisma.PrismaPromise<GetDeckCardAggregateType<T>>

    /**
     * Group by DeckCard.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeckCardGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DeckCardGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DeckCardGroupByArgs['orderBy'] }
        : { orderBy?: DeckCardGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DeckCardGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeckCardGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DeckCard model
   */
  readonly fields: DeckCardFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DeckCard.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DeckCardClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    deck<T extends DeckDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DeckDefaultArgs<ExtArgs>>): Prisma__DeckClient<$Result.GetResult<Prisma.$DeckPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DeckCard model
   */
  interface DeckCardFieldRefs {
    readonly id: FieldRef<"DeckCard", 'String'>
    readonly deckId: FieldRef<"DeckCard", 'String'>
    readonly scryfallId: FieldRef<"DeckCard", 'String'>
    readonly name: FieldRef<"DeckCard", 'String'>
    readonly manaCost: FieldRef<"DeckCard", 'String'>
    readonly cmc: FieldRef<"DeckCard", 'Float'>
    readonly typeLine: FieldRef<"DeckCard", 'String'>
    readonly oracleText: FieldRef<"DeckCard", 'String'>
    readonly colorIdentity: FieldRef<"DeckCard", 'String[]'>
    readonly isGameChanger: FieldRef<"DeckCard", 'Boolean'>
    readonly isBanned: FieldRef<"DeckCard", 'Boolean'>
    readonly price: FieldRef<"DeckCard", 'Float'>
    readonly imageUri: FieldRef<"DeckCard", 'String'>
    readonly artCropUri: FieldRef<"DeckCard", 'String'>
    readonly category: FieldRef<"DeckCard", 'String'>
    readonly quantity: FieldRef<"DeckCard", 'Int'>
    readonly isCommander: FieldRef<"DeckCard", 'Boolean'>
    readonly isPartner: FieldRef<"DeckCard", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * DeckCard findUnique
   */
  export type DeckCardFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * Filter, which DeckCard to fetch.
     */
    where: DeckCardWhereUniqueInput
  }

  /**
   * DeckCard findUniqueOrThrow
   */
  export type DeckCardFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * Filter, which DeckCard to fetch.
     */
    where: DeckCardWhereUniqueInput
  }

  /**
   * DeckCard findFirst
   */
  export type DeckCardFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * Filter, which DeckCard to fetch.
     */
    where?: DeckCardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeckCards to fetch.
     */
    orderBy?: DeckCardOrderByWithRelationInput | DeckCardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeckCards.
     */
    cursor?: DeckCardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeckCards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeckCards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeckCards.
     */
    distinct?: DeckCardScalarFieldEnum | DeckCardScalarFieldEnum[]
  }

  /**
   * DeckCard findFirstOrThrow
   */
  export type DeckCardFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * Filter, which DeckCard to fetch.
     */
    where?: DeckCardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeckCards to fetch.
     */
    orderBy?: DeckCardOrderByWithRelationInput | DeckCardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeckCards.
     */
    cursor?: DeckCardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeckCards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeckCards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeckCards.
     */
    distinct?: DeckCardScalarFieldEnum | DeckCardScalarFieldEnum[]
  }

  /**
   * DeckCard findMany
   */
  export type DeckCardFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * Filter, which DeckCards to fetch.
     */
    where?: DeckCardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeckCards to fetch.
     */
    orderBy?: DeckCardOrderByWithRelationInput | DeckCardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DeckCards.
     */
    cursor?: DeckCardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeckCards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeckCards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeckCards.
     */
    distinct?: DeckCardScalarFieldEnum | DeckCardScalarFieldEnum[]
  }

  /**
   * DeckCard create
   */
  export type DeckCardCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * The data needed to create a DeckCard.
     */
    data: XOR<DeckCardCreateInput, DeckCardUncheckedCreateInput>
  }

  /**
   * DeckCard createMany
   */
  export type DeckCardCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DeckCards.
     */
    data: DeckCardCreateManyInput | DeckCardCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DeckCard createManyAndReturn
   */
  export type DeckCardCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * The data used to create many DeckCards.
     */
    data: DeckCardCreateManyInput | DeckCardCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * DeckCard update
   */
  export type DeckCardUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * The data needed to update a DeckCard.
     */
    data: XOR<DeckCardUpdateInput, DeckCardUncheckedUpdateInput>
    /**
     * Choose, which DeckCard to update.
     */
    where: DeckCardWhereUniqueInput
  }

  /**
   * DeckCard updateMany
   */
  export type DeckCardUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DeckCards.
     */
    data: XOR<DeckCardUpdateManyMutationInput, DeckCardUncheckedUpdateManyInput>
    /**
     * Filter which DeckCards to update
     */
    where?: DeckCardWhereInput
    /**
     * Limit how many DeckCards to update.
     */
    limit?: number
  }

  /**
   * DeckCard updateManyAndReturn
   */
  export type DeckCardUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * The data used to update DeckCards.
     */
    data: XOR<DeckCardUpdateManyMutationInput, DeckCardUncheckedUpdateManyInput>
    /**
     * Filter which DeckCards to update
     */
    where?: DeckCardWhereInput
    /**
     * Limit how many DeckCards to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * DeckCard upsert
   */
  export type DeckCardUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * The filter to search for the DeckCard to update in case it exists.
     */
    where: DeckCardWhereUniqueInput
    /**
     * In case the DeckCard found by the `where` argument doesn't exist, create a new DeckCard with this data.
     */
    create: XOR<DeckCardCreateInput, DeckCardUncheckedCreateInput>
    /**
     * In case the DeckCard was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DeckCardUpdateInput, DeckCardUncheckedUpdateInput>
  }

  /**
   * DeckCard delete
   */
  export type DeckCardDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
    /**
     * Filter which DeckCard to delete.
     */
    where: DeckCardWhereUniqueInput
  }

  /**
   * DeckCard deleteMany
   */
  export type DeckCardDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeckCards to delete
     */
    where?: DeckCardWhereInput
    /**
     * Limit how many DeckCards to delete.
     */
    limit?: number
  }

  /**
   * DeckCard without action
   */
  export type DeckCardDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeckCard
     */
    select?: DeckCardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeckCard
     */
    omit?: DeckCardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeckCardInclude<ExtArgs> | null
  }


  /**
   * Model CardCache
   */

  export type AggregateCardCache = {
    _count: CardCacheCountAggregateOutputType | null
    _min: CardCacheMinAggregateOutputType | null
    _max: CardCacheMaxAggregateOutputType | null
  }

  export type CardCacheMinAggregateOutputType = {
    scryfallId: string | null
    cachedAt: Date | null
  }

  export type CardCacheMaxAggregateOutputType = {
    scryfallId: string | null
    cachedAt: Date | null
  }

  export type CardCacheCountAggregateOutputType = {
    scryfallId: number
    data: number
    cachedAt: number
    _all: number
  }


  export type CardCacheMinAggregateInputType = {
    scryfallId?: true
    cachedAt?: true
  }

  export type CardCacheMaxAggregateInputType = {
    scryfallId?: true
    cachedAt?: true
  }

  export type CardCacheCountAggregateInputType = {
    scryfallId?: true
    data?: true
    cachedAt?: true
    _all?: true
  }

  export type CardCacheAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CardCache to aggregate.
     */
    where?: CardCacheWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CardCaches to fetch.
     */
    orderBy?: CardCacheOrderByWithRelationInput | CardCacheOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CardCacheWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CardCaches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CardCaches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CardCaches
    **/
    _count?: true | CardCacheCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CardCacheMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CardCacheMaxAggregateInputType
  }

  export type GetCardCacheAggregateType<T extends CardCacheAggregateArgs> = {
        [P in keyof T & keyof AggregateCardCache]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCardCache[P]>
      : GetScalarType<T[P], AggregateCardCache[P]>
  }




  export type CardCacheGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CardCacheWhereInput
    orderBy?: CardCacheOrderByWithAggregationInput | CardCacheOrderByWithAggregationInput[]
    by: CardCacheScalarFieldEnum[] | CardCacheScalarFieldEnum
    having?: CardCacheScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CardCacheCountAggregateInputType | true
    _min?: CardCacheMinAggregateInputType
    _max?: CardCacheMaxAggregateInputType
  }

  export type CardCacheGroupByOutputType = {
    scryfallId: string
    data: JsonValue
    cachedAt: Date
    _count: CardCacheCountAggregateOutputType | null
    _min: CardCacheMinAggregateOutputType | null
    _max: CardCacheMaxAggregateOutputType | null
  }

  type GetCardCacheGroupByPayload<T extends CardCacheGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CardCacheGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CardCacheGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CardCacheGroupByOutputType[P]>
            : GetScalarType<T[P], CardCacheGroupByOutputType[P]>
        }
      >
    >


  export type CardCacheSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    scryfallId?: boolean
    data?: boolean
    cachedAt?: boolean
  }, ExtArgs["result"]["cardCache"]>

  export type CardCacheSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    scryfallId?: boolean
    data?: boolean
    cachedAt?: boolean
  }, ExtArgs["result"]["cardCache"]>

  export type CardCacheSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    scryfallId?: boolean
    data?: boolean
    cachedAt?: boolean
  }, ExtArgs["result"]["cardCache"]>

  export type CardCacheSelectScalar = {
    scryfallId?: boolean
    data?: boolean
    cachedAt?: boolean
  }

  export type CardCacheOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"scryfallId" | "data" | "cachedAt", ExtArgs["result"]["cardCache"]>

  export type $CardCachePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CardCache"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      scryfallId: string
      data: Prisma.JsonValue
      cachedAt: Date
    }, ExtArgs["result"]["cardCache"]>
    composites: {}
  }

  type CardCacheGetPayload<S extends boolean | null | undefined | CardCacheDefaultArgs> = $Result.GetResult<Prisma.$CardCachePayload, S>

  type CardCacheCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CardCacheFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CardCacheCountAggregateInputType | true
    }

  export interface CardCacheDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CardCache'], meta: { name: 'CardCache' } }
    /**
     * Find zero or one CardCache that matches the filter.
     * @param {CardCacheFindUniqueArgs} args - Arguments to find a CardCache
     * @example
     * // Get one CardCache
     * const cardCache = await prisma.cardCache.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CardCacheFindUniqueArgs>(args: SelectSubset<T, CardCacheFindUniqueArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CardCache that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CardCacheFindUniqueOrThrowArgs} args - Arguments to find a CardCache
     * @example
     * // Get one CardCache
     * const cardCache = await prisma.cardCache.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CardCacheFindUniqueOrThrowArgs>(args: SelectSubset<T, CardCacheFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CardCache that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheFindFirstArgs} args - Arguments to find a CardCache
     * @example
     * // Get one CardCache
     * const cardCache = await prisma.cardCache.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CardCacheFindFirstArgs>(args?: SelectSubset<T, CardCacheFindFirstArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CardCache that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheFindFirstOrThrowArgs} args - Arguments to find a CardCache
     * @example
     * // Get one CardCache
     * const cardCache = await prisma.cardCache.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CardCacheFindFirstOrThrowArgs>(args?: SelectSubset<T, CardCacheFindFirstOrThrowArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CardCaches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CardCaches
     * const cardCaches = await prisma.cardCache.findMany()
     * 
     * // Get first 10 CardCaches
     * const cardCaches = await prisma.cardCache.findMany({ take: 10 })
     * 
     * // Only select the `scryfallId`
     * const cardCacheWithScryfallIdOnly = await prisma.cardCache.findMany({ select: { scryfallId: true } })
     * 
     */
    findMany<T extends CardCacheFindManyArgs>(args?: SelectSubset<T, CardCacheFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CardCache.
     * @param {CardCacheCreateArgs} args - Arguments to create a CardCache.
     * @example
     * // Create one CardCache
     * const CardCache = await prisma.cardCache.create({
     *   data: {
     *     // ... data to create a CardCache
     *   }
     * })
     * 
     */
    create<T extends CardCacheCreateArgs>(args: SelectSubset<T, CardCacheCreateArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CardCaches.
     * @param {CardCacheCreateManyArgs} args - Arguments to create many CardCaches.
     * @example
     * // Create many CardCaches
     * const cardCache = await prisma.cardCache.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CardCacheCreateManyArgs>(args?: SelectSubset<T, CardCacheCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CardCaches and returns the data saved in the database.
     * @param {CardCacheCreateManyAndReturnArgs} args - Arguments to create many CardCaches.
     * @example
     * // Create many CardCaches
     * const cardCache = await prisma.cardCache.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CardCaches and only return the `scryfallId`
     * const cardCacheWithScryfallIdOnly = await prisma.cardCache.createManyAndReturn({
     *   select: { scryfallId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CardCacheCreateManyAndReturnArgs>(args?: SelectSubset<T, CardCacheCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CardCache.
     * @param {CardCacheDeleteArgs} args - Arguments to delete one CardCache.
     * @example
     * // Delete one CardCache
     * const CardCache = await prisma.cardCache.delete({
     *   where: {
     *     // ... filter to delete one CardCache
     *   }
     * })
     * 
     */
    delete<T extends CardCacheDeleteArgs>(args: SelectSubset<T, CardCacheDeleteArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CardCache.
     * @param {CardCacheUpdateArgs} args - Arguments to update one CardCache.
     * @example
     * // Update one CardCache
     * const cardCache = await prisma.cardCache.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CardCacheUpdateArgs>(args: SelectSubset<T, CardCacheUpdateArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CardCaches.
     * @param {CardCacheDeleteManyArgs} args - Arguments to filter CardCaches to delete.
     * @example
     * // Delete a few CardCaches
     * const { count } = await prisma.cardCache.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CardCacheDeleteManyArgs>(args?: SelectSubset<T, CardCacheDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CardCaches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CardCaches
     * const cardCache = await prisma.cardCache.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CardCacheUpdateManyArgs>(args: SelectSubset<T, CardCacheUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CardCaches and returns the data updated in the database.
     * @param {CardCacheUpdateManyAndReturnArgs} args - Arguments to update many CardCaches.
     * @example
     * // Update many CardCaches
     * const cardCache = await prisma.cardCache.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CardCaches and only return the `scryfallId`
     * const cardCacheWithScryfallIdOnly = await prisma.cardCache.updateManyAndReturn({
     *   select: { scryfallId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CardCacheUpdateManyAndReturnArgs>(args: SelectSubset<T, CardCacheUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CardCache.
     * @param {CardCacheUpsertArgs} args - Arguments to update or create a CardCache.
     * @example
     * // Update or create a CardCache
     * const cardCache = await prisma.cardCache.upsert({
     *   create: {
     *     // ... data to create a CardCache
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CardCache we want to update
     *   }
     * })
     */
    upsert<T extends CardCacheUpsertArgs>(args: SelectSubset<T, CardCacheUpsertArgs<ExtArgs>>): Prisma__CardCacheClient<$Result.GetResult<Prisma.$CardCachePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CardCaches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheCountArgs} args - Arguments to filter CardCaches to count.
     * @example
     * // Count the number of CardCaches
     * const count = await prisma.cardCache.count({
     *   where: {
     *     // ... the filter for the CardCaches we want to count
     *   }
     * })
    **/
    count<T extends CardCacheCountArgs>(
      args?: Subset<T, CardCacheCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CardCacheCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CardCache.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CardCacheAggregateArgs>(args: Subset<T, CardCacheAggregateArgs>): Prisma.PrismaPromise<GetCardCacheAggregateType<T>>

    /**
     * Group by CardCache.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CardCacheGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CardCacheGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CardCacheGroupByArgs['orderBy'] }
        : { orderBy?: CardCacheGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CardCacheGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCardCacheGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CardCache model
   */
  readonly fields: CardCacheFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CardCache.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CardCacheClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CardCache model
   */
  interface CardCacheFieldRefs {
    readonly scryfallId: FieldRef<"CardCache", 'String'>
    readonly data: FieldRef<"CardCache", 'Json'>
    readonly cachedAt: FieldRef<"CardCache", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CardCache findUnique
   */
  export type CardCacheFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * Filter, which CardCache to fetch.
     */
    where: CardCacheWhereUniqueInput
  }

  /**
   * CardCache findUniqueOrThrow
   */
  export type CardCacheFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * Filter, which CardCache to fetch.
     */
    where: CardCacheWhereUniqueInput
  }

  /**
   * CardCache findFirst
   */
  export type CardCacheFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * Filter, which CardCache to fetch.
     */
    where?: CardCacheWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CardCaches to fetch.
     */
    orderBy?: CardCacheOrderByWithRelationInput | CardCacheOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CardCaches.
     */
    cursor?: CardCacheWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CardCaches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CardCaches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CardCaches.
     */
    distinct?: CardCacheScalarFieldEnum | CardCacheScalarFieldEnum[]
  }

  /**
   * CardCache findFirstOrThrow
   */
  export type CardCacheFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * Filter, which CardCache to fetch.
     */
    where?: CardCacheWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CardCaches to fetch.
     */
    orderBy?: CardCacheOrderByWithRelationInput | CardCacheOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CardCaches.
     */
    cursor?: CardCacheWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CardCaches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CardCaches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CardCaches.
     */
    distinct?: CardCacheScalarFieldEnum | CardCacheScalarFieldEnum[]
  }

  /**
   * CardCache findMany
   */
  export type CardCacheFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * Filter, which CardCaches to fetch.
     */
    where?: CardCacheWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CardCaches to fetch.
     */
    orderBy?: CardCacheOrderByWithRelationInput | CardCacheOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CardCaches.
     */
    cursor?: CardCacheWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CardCaches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CardCaches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CardCaches.
     */
    distinct?: CardCacheScalarFieldEnum | CardCacheScalarFieldEnum[]
  }

  /**
   * CardCache create
   */
  export type CardCacheCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * The data needed to create a CardCache.
     */
    data: XOR<CardCacheCreateInput, CardCacheUncheckedCreateInput>
  }

  /**
   * CardCache createMany
   */
  export type CardCacheCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CardCaches.
     */
    data: CardCacheCreateManyInput | CardCacheCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CardCache createManyAndReturn
   */
  export type CardCacheCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * The data used to create many CardCaches.
     */
    data: CardCacheCreateManyInput | CardCacheCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CardCache update
   */
  export type CardCacheUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * The data needed to update a CardCache.
     */
    data: XOR<CardCacheUpdateInput, CardCacheUncheckedUpdateInput>
    /**
     * Choose, which CardCache to update.
     */
    where: CardCacheWhereUniqueInput
  }

  /**
   * CardCache updateMany
   */
  export type CardCacheUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CardCaches.
     */
    data: XOR<CardCacheUpdateManyMutationInput, CardCacheUncheckedUpdateManyInput>
    /**
     * Filter which CardCaches to update
     */
    where?: CardCacheWhereInput
    /**
     * Limit how many CardCaches to update.
     */
    limit?: number
  }

  /**
   * CardCache updateManyAndReturn
   */
  export type CardCacheUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * The data used to update CardCaches.
     */
    data: XOR<CardCacheUpdateManyMutationInput, CardCacheUncheckedUpdateManyInput>
    /**
     * Filter which CardCaches to update
     */
    where?: CardCacheWhereInput
    /**
     * Limit how many CardCaches to update.
     */
    limit?: number
  }

  /**
   * CardCache upsert
   */
  export type CardCacheUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * The filter to search for the CardCache to update in case it exists.
     */
    where: CardCacheWhereUniqueInput
    /**
     * In case the CardCache found by the `where` argument doesn't exist, create a new CardCache with this data.
     */
    create: XOR<CardCacheCreateInput, CardCacheUncheckedCreateInput>
    /**
     * In case the CardCache was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CardCacheUpdateInput, CardCacheUncheckedUpdateInput>
  }

  /**
   * CardCache delete
   */
  export type CardCacheDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
    /**
     * Filter which CardCache to delete.
     */
    where: CardCacheWhereUniqueInput
  }

  /**
   * CardCache deleteMany
   */
  export type CardCacheDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CardCaches to delete
     */
    where?: CardCacheWhereInput
    /**
     * Limit how many CardCaches to delete.
     */
    limit?: number
  }

  /**
   * CardCache without action
   */
  export type CardCacheDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CardCache
     */
    select?: CardCacheSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CardCache
     */
    omit?: CardCacheOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const DeckScalarFieldEnum: {
    id: 'id',
    name: 'name',
    format: 'format',
    targetBracket: 'targetBracket',
    budget: 'budget',
    commanderId: 'commanderId',
    partnerId: 'partnerId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DeckScalarFieldEnum = (typeof DeckScalarFieldEnum)[keyof typeof DeckScalarFieldEnum]


  export const DeckCardScalarFieldEnum: {
    id: 'id',
    deckId: 'deckId',
    scryfallId: 'scryfallId',
    name: 'name',
    manaCost: 'manaCost',
    cmc: 'cmc',
    typeLine: 'typeLine',
    oracleText: 'oracleText',
    colorIdentity: 'colorIdentity',
    isGameChanger: 'isGameChanger',
    isBanned: 'isBanned',
    price: 'price',
    imageUri: 'imageUri',
    artCropUri: 'artCropUri',
    category: 'category',
    quantity: 'quantity',
    isCommander: 'isCommander',
    isPartner: 'isPartner'
  };

  export type DeckCardScalarFieldEnum = (typeof DeckCardScalarFieldEnum)[keyof typeof DeckCardScalarFieldEnum]


  export const CardCacheScalarFieldEnum: {
    scryfallId: 'scryfallId',
    data: 'data',
    cachedAt: 'cachedAt'
  };

  export type CardCacheScalarFieldEnum = (typeof CardCacheScalarFieldEnum)[keyof typeof CardCacheScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    
  /**
   * Deep Input Types
   */


  export type DeckWhereInput = {
    AND?: DeckWhereInput | DeckWhereInput[]
    OR?: DeckWhereInput[]
    NOT?: DeckWhereInput | DeckWhereInput[]
    id?: StringFilter<"Deck"> | string
    name?: StringFilter<"Deck"> | string
    format?: StringFilter<"Deck"> | string
    targetBracket?: IntFilter<"Deck"> | number
    budget?: FloatNullableFilter<"Deck"> | number | null
    commanderId?: StringNullableFilter<"Deck"> | string | null
    partnerId?: StringNullableFilter<"Deck"> | string | null
    createdAt?: DateTimeFilter<"Deck"> | Date | string
    updatedAt?: DateTimeFilter<"Deck"> | Date | string
    cards?: DeckCardListRelationFilter
  }

  export type DeckOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    format?: SortOrder
    targetBracket?: SortOrder
    budget?: SortOrderInput | SortOrder
    commanderId?: SortOrderInput | SortOrder
    partnerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    cards?: DeckCardOrderByRelationAggregateInput
  }

  export type DeckWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DeckWhereInput | DeckWhereInput[]
    OR?: DeckWhereInput[]
    NOT?: DeckWhereInput | DeckWhereInput[]
    name?: StringFilter<"Deck"> | string
    format?: StringFilter<"Deck"> | string
    targetBracket?: IntFilter<"Deck"> | number
    budget?: FloatNullableFilter<"Deck"> | number | null
    commanderId?: StringNullableFilter<"Deck"> | string | null
    partnerId?: StringNullableFilter<"Deck"> | string | null
    createdAt?: DateTimeFilter<"Deck"> | Date | string
    updatedAt?: DateTimeFilter<"Deck"> | Date | string
    cards?: DeckCardListRelationFilter
  }, "id">

  export type DeckOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    format?: SortOrder
    targetBracket?: SortOrder
    budget?: SortOrderInput | SortOrder
    commanderId?: SortOrderInput | SortOrder
    partnerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DeckCountOrderByAggregateInput
    _avg?: DeckAvgOrderByAggregateInput
    _max?: DeckMaxOrderByAggregateInput
    _min?: DeckMinOrderByAggregateInput
    _sum?: DeckSumOrderByAggregateInput
  }

  export type DeckScalarWhereWithAggregatesInput = {
    AND?: DeckScalarWhereWithAggregatesInput | DeckScalarWhereWithAggregatesInput[]
    OR?: DeckScalarWhereWithAggregatesInput[]
    NOT?: DeckScalarWhereWithAggregatesInput | DeckScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Deck"> | string
    name?: StringWithAggregatesFilter<"Deck"> | string
    format?: StringWithAggregatesFilter<"Deck"> | string
    targetBracket?: IntWithAggregatesFilter<"Deck"> | number
    budget?: FloatNullableWithAggregatesFilter<"Deck"> | number | null
    commanderId?: StringNullableWithAggregatesFilter<"Deck"> | string | null
    partnerId?: StringNullableWithAggregatesFilter<"Deck"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Deck"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Deck"> | Date | string
  }

  export type DeckCardWhereInput = {
    AND?: DeckCardWhereInput | DeckCardWhereInput[]
    OR?: DeckCardWhereInput[]
    NOT?: DeckCardWhereInput | DeckCardWhereInput[]
    id?: StringFilter<"DeckCard"> | string
    deckId?: StringFilter<"DeckCard"> | string
    scryfallId?: StringFilter<"DeckCard"> | string
    name?: StringFilter<"DeckCard"> | string
    manaCost?: StringFilter<"DeckCard"> | string
    cmc?: FloatFilter<"DeckCard"> | number
    typeLine?: StringFilter<"DeckCard"> | string
    oracleText?: StringFilter<"DeckCard"> | string
    colorIdentity?: StringNullableListFilter<"DeckCard">
    isGameChanger?: BoolFilter<"DeckCard"> | boolean
    isBanned?: BoolFilter<"DeckCard"> | boolean
    price?: FloatNullableFilter<"DeckCard"> | number | null
    imageUri?: StringFilter<"DeckCard"> | string
    artCropUri?: StringFilter<"DeckCard"> | string
    category?: StringFilter<"DeckCard"> | string
    quantity?: IntFilter<"DeckCard"> | number
    isCommander?: BoolFilter<"DeckCard"> | boolean
    isPartner?: BoolFilter<"DeckCard"> | boolean
    deck?: XOR<DeckScalarRelationFilter, DeckWhereInput>
  }

  export type DeckCardOrderByWithRelationInput = {
    id?: SortOrder
    deckId?: SortOrder
    scryfallId?: SortOrder
    name?: SortOrder
    manaCost?: SortOrder
    cmc?: SortOrder
    typeLine?: SortOrder
    oracleText?: SortOrder
    colorIdentity?: SortOrder
    isGameChanger?: SortOrder
    isBanned?: SortOrder
    price?: SortOrderInput | SortOrder
    imageUri?: SortOrder
    artCropUri?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    isCommander?: SortOrder
    isPartner?: SortOrder
    deck?: DeckOrderByWithRelationInput
  }

  export type DeckCardWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DeckCardWhereInput | DeckCardWhereInput[]
    OR?: DeckCardWhereInput[]
    NOT?: DeckCardWhereInput | DeckCardWhereInput[]
    deckId?: StringFilter<"DeckCard"> | string
    scryfallId?: StringFilter<"DeckCard"> | string
    name?: StringFilter<"DeckCard"> | string
    manaCost?: StringFilter<"DeckCard"> | string
    cmc?: FloatFilter<"DeckCard"> | number
    typeLine?: StringFilter<"DeckCard"> | string
    oracleText?: StringFilter<"DeckCard"> | string
    colorIdentity?: StringNullableListFilter<"DeckCard">
    isGameChanger?: BoolFilter<"DeckCard"> | boolean
    isBanned?: BoolFilter<"DeckCard"> | boolean
    price?: FloatNullableFilter<"DeckCard"> | number | null
    imageUri?: StringFilter<"DeckCard"> | string
    artCropUri?: StringFilter<"DeckCard"> | string
    category?: StringFilter<"DeckCard"> | string
    quantity?: IntFilter<"DeckCard"> | number
    isCommander?: BoolFilter<"DeckCard"> | boolean
    isPartner?: BoolFilter<"DeckCard"> | boolean
    deck?: XOR<DeckScalarRelationFilter, DeckWhereInput>
  }, "id">

  export type DeckCardOrderByWithAggregationInput = {
    id?: SortOrder
    deckId?: SortOrder
    scryfallId?: SortOrder
    name?: SortOrder
    manaCost?: SortOrder
    cmc?: SortOrder
    typeLine?: SortOrder
    oracleText?: SortOrder
    colorIdentity?: SortOrder
    isGameChanger?: SortOrder
    isBanned?: SortOrder
    price?: SortOrderInput | SortOrder
    imageUri?: SortOrder
    artCropUri?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    isCommander?: SortOrder
    isPartner?: SortOrder
    _count?: DeckCardCountOrderByAggregateInput
    _avg?: DeckCardAvgOrderByAggregateInput
    _max?: DeckCardMaxOrderByAggregateInput
    _min?: DeckCardMinOrderByAggregateInput
    _sum?: DeckCardSumOrderByAggregateInput
  }

  export type DeckCardScalarWhereWithAggregatesInput = {
    AND?: DeckCardScalarWhereWithAggregatesInput | DeckCardScalarWhereWithAggregatesInput[]
    OR?: DeckCardScalarWhereWithAggregatesInput[]
    NOT?: DeckCardScalarWhereWithAggregatesInput | DeckCardScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DeckCard"> | string
    deckId?: StringWithAggregatesFilter<"DeckCard"> | string
    scryfallId?: StringWithAggregatesFilter<"DeckCard"> | string
    name?: StringWithAggregatesFilter<"DeckCard"> | string
    manaCost?: StringWithAggregatesFilter<"DeckCard"> | string
    cmc?: FloatWithAggregatesFilter<"DeckCard"> | number
    typeLine?: StringWithAggregatesFilter<"DeckCard"> | string
    oracleText?: StringWithAggregatesFilter<"DeckCard"> | string
    colorIdentity?: StringNullableListFilter<"DeckCard">
    isGameChanger?: BoolWithAggregatesFilter<"DeckCard"> | boolean
    isBanned?: BoolWithAggregatesFilter<"DeckCard"> | boolean
    price?: FloatNullableWithAggregatesFilter<"DeckCard"> | number | null
    imageUri?: StringWithAggregatesFilter<"DeckCard"> | string
    artCropUri?: StringWithAggregatesFilter<"DeckCard"> | string
    category?: StringWithAggregatesFilter<"DeckCard"> | string
    quantity?: IntWithAggregatesFilter<"DeckCard"> | number
    isCommander?: BoolWithAggregatesFilter<"DeckCard"> | boolean
    isPartner?: BoolWithAggregatesFilter<"DeckCard"> | boolean
  }

  export type CardCacheWhereInput = {
    AND?: CardCacheWhereInput | CardCacheWhereInput[]
    OR?: CardCacheWhereInput[]
    NOT?: CardCacheWhereInput | CardCacheWhereInput[]
    scryfallId?: StringFilter<"CardCache"> | string
    data?: JsonFilter<"CardCache">
    cachedAt?: DateTimeFilter<"CardCache"> | Date | string
  }

  export type CardCacheOrderByWithRelationInput = {
    scryfallId?: SortOrder
    data?: SortOrder
    cachedAt?: SortOrder
  }

  export type CardCacheWhereUniqueInput = Prisma.AtLeast<{
    scryfallId?: string
    AND?: CardCacheWhereInput | CardCacheWhereInput[]
    OR?: CardCacheWhereInput[]
    NOT?: CardCacheWhereInput | CardCacheWhereInput[]
    data?: JsonFilter<"CardCache">
    cachedAt?: DateTimeFilter<"CardCache"> | Date | string
  }, "scryfallId">

  export type CardCacheOrderByWithAggregationInput = {
    scryfallId?: SortOrder
    data?: SortOrder
    cachedAt?: SortOrder
    _count?: CardCacheCountOrderByAggregateInput
    _max?: CardCacheMaxOrderByAggregateInput
    _min?: CardCacheMinOrderByAggregateInput
  }

  export type CardCacheScalarWhereWithAggregatesInput = {
    AND?: CardCacheScalarWhereWithAggregatesInput | CardCacheScalarWhereWithAggregatesInput[]
    OR?: CardCacheScalarWhereWithAggregatesInput[]
    NOT?: CardCacheScalarWhereWithAggregatesInput | CardCacheScalarWhereWithAggregatesInput[]
    scryfallId?: StringWithAggregatesFilter<"CardCache"> | string
    data?: JsonWithAggregatesFilter<"CardCache">
    cachedAt?: DateTimeWithAggregatesFilter<"CardCache"> | Date | string
  }

  export type DeckCreateInput = {
    id?: string
    name: string
    format?: string
    targetBracket?: number
    budget?: number | null
    commanderId?: string | null
    partnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cards?: DeckCardCreateNestedManyWithoutDeckInput
  }

  export type DeckUncheckedCreateInput = {
    id?: string
    name: string
    format?: string
    targetBracket?: number
    budget?: number | null
    commanderId?: string | null
    partnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cards?: DeckCardUncheckedCreateNestedManyWithoutDeckInput
  }

  export type DeckUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    format?: StringFieldUpdateOperationsInput | string
    targetBracket?: IntFieldUpdateOperationsInput | number
    budget?: NullableFloatFieldUpdateOperationsInput | number | null
    commanderId?: NullableStringFieldUpdateOperationsInput | string | null
    partnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cards?: DeckCardUpdateManyWithoutDeckNestedInput
  }

  export type DeckUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    format?: StringFieldUpdateOperationsInput | string
    targetBracket?: IntFieldUpdateOperationsInput | number
    budget?: NullableFloatFieldUpdateOperationsInput | number | null
    commanderId?: NullableStringFieldUpdateOperationsInput | string | null
    partnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cards?: DeckCardUncheckedUpdateManyWithoutDeckNestedInput
  }

  export type DeckCreateManyInput = {
    id?: string
    name: string
    format?: string
    targetBracket?: number
    budget?: number | null
    commanderId?: string | null
    partnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DeckUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    format?: StringFieldUpdateOperationsInput | string
    targetBracket?: IntFieldUpdateOperationsInput | number
    budget?: NullableFloatFieldUpdateOperationsInput | number | null
    commanderId?: NullableStringFieldUpdateOperationsInput | string | null
    partnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeckUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    format?: StringFieldUpdateOperationsInput | string
    targetBracket?: IntFieldUpdateOperationsInput | number
    budget?: NullableFloatFieldUpdateOperationsInput | number | null
    commanderId?: NullableStringFieldUpdateOperationsInput | string | null
    partnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeckCardCreateInput = {
    id?: string
    scryfallId: string
    name: string
    manaCost?: string
    cmc?: number
    typeLine?: string
    oracleText?: string
    colorIdentity?: DeckCardCreatecolorIdentityInput | string[]
    isGameChanger?: boolean
    isBanned?: boolean
    price?: number | null
    imageUri?: string
    artCropUri?: string
    category?: string
    quantity?: number
    isCommander?: boolean
    isPartner?: boolean
    deck: DeckCreateNestedOneWithoutCardsInput
  }

  export type DeckCardUncheckedCreateInput = {
    id?: string
    deckId: string
    scryfallId: string
    name: string
    manaCost?: string
    cmc?: number
    typeLine?: string
    oracleText?: string
    colorIdentity?: DeckCardCreatecolorIdentityInput | string[]
    isGameChanger?: boolean
    isBanned?: boolean
    price?: number | null
    imageUri?: string
    artCropUri?: string
    category?: string
    quantity?: number
    isCommander?: boolean
    isPartner?: boolean
  }

  export type DeckCardUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
    deck?: DeckUpdateOneRequiredWithoutCardsNestedInput
  }

  export type DeckCardUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    deckId?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
  }

  export type DeckCardCreateManyInput = {
    id?: string
    deckId: string
    scryfallId: string
    name: string
    manaCost?: string
    cmc?: number
    typeLine?: string
    oracleText?: string
    colorIdentity?: DeckCardCreatecolorIdentityInput | string[]
    isGameChanger?: boolean
    isBanned?: boolean
    price?: number | null
    imageUri?: string
    artCropUri?: string
    category?: string
    quantity?: number
    isCommander?: boolean
    isPartner?: boolean
  }

  export type DeckCardUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
  }

  export type DeckCardUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    deckId?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
  }

  export type CardCacheCreateInput = {
    scryfallId: string
    data: JsonNullValueInput | InputJsonValue
    cachedAt?: Date | string
  }

  export type CardCacheUncheckedCreateInput = {
    scryfallId: string
    data: JsonNullValueInput | InputJsonValue
    cachedAt?: Date | string
  }

  export type CardCacheUpdateInput = {
    scryfallId?: StringFieldUpdateOperationsInput | string
    data?: JsonNullValueInput | InputJsonValue
    cachedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CardCacheUncheckedUpdateInput = {
    scryfallId?: StringFieldUpdateOperationsInput | string
    data?: JsonNullValueInput | InputJsonValue
    cachedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CardCacheCreateManyInput = {
    scryfallId: string
    data: JsonNullValueInput | InputJsonValue
    cachedAt?: Date | string
  }

  export type CardCacheUpdateManyMutationInput = {
    scryfallId?: StringFieldUpdateOperationsInput | string
    data?: JsonNullValueInput | InputJsonValue
    cachedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CardCacheUncheckedUpdateManyInput = {
    scryfallId?: StringFieldUpdateOperationsInput | string
    data?: JsonNullValueInput | InputJsonValue
    cachedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DeckCardListRelationFilter = {
    every?: DeckCardWhereInput
    some?: DeckCardWhereInput
    none?: DeckCardWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type DeckCardOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DeckCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    format?: SortOrder
    targetBracket?: SortOrder
    budget?: SortOrder
    commanderId?: SortOrder
    partnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DeckAvgOrderByAggregateInput = {
    targetBracket?: SortOrder
    budget?: SortOrder
  }

  export type DeckMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    format?: SortOrder
    targetBracket?: SortOrder
    budget?: SortOrder
    commanderId?: SortOrder
    partnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DeckMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    format?: SortOrder
    targetBracket?: SortOrder
    budget?: SortOrder
    commanderId?: SortOrder
    partnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DeckSumOrderByAggregateInput = {
    targetBracket?: SortOrder
    budget?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DeckScalarRelationFilter = {
    is?: DeckWhereInput
    isNot?: DeckWhereInput
  }

  export type DeckCardCountOrderByAggregateInput = {
    id?: SortOrder
    deckId?: SortOrder
    scryfallId?: SortOrder
    name?: SortOrder
    manaCost?: SortOrder
    cmc?: SortOrder
    typeLine?: SortOrder
    oracleText?: SortOrder
    colorIdentity?: SortOrder
    isGameChanger?: SortOrder
    isBanned?: SortOrder
    price?: SortOrder
    imageUri?: SortOrder
    artCropUri?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    isCommander?: SortOrder
    isPartner?: SortOrder
  }

  export type DeckCardAvgOrderByAggregateInput = {
    cmc?: SortOrder
    price?: SortOrder
    quantity?: SortOrder
  }

  export type DeckCardMaxOrderByAggregateInput = {
    id?: SortOrder
    deckId?: SortOrder
    scryfallId?: SortOrder
    name?: SortOrder
    manaCost?: SortOrder
    cmc?: SortOrder
    typeLine?: SortOrder
    oracleText?: SortOrder
    isGameChanger?: SortOrder
    isBanned?: SortOrder
    price?: SortOrder
    imageUri?: SortOrder
    artCropUri?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    isCommander?: SortOrder
    isPartner?: SortOrder
  }

  export type DeckCardMinOrderByAggregateInput = {
    id?: SortOrder
    deckId?: SortOrder
    scryfallId?: SortOrder
    name?: SortOrder
    manaCost?: SortOrder
    cmc?: SortOrder
    typeLine?: SortOrder
    oracleText?: SortOrder
    isGameChanger?: SortOrder
    isBanned?: SortOrder
    price?: SortOrder
    imageUri?: SortOrder
    artCropUri?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    isCommander?: SortOrder
    isPartner?: SortOrder
  }

  export type DeckCardSumOrderByAggregateInput = {
    cmc?: SortOrder
    price?: SortOrder
    quantity?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type CardCacheCountOrderByAggregateInput = {
    scryfallId?: SortOrder
    data?: SortOrder
    cachedAt?: SortOrder
  }

  export type CardCacheMaxOrderByAggregateInput = {
    scryfallId?: SortOrder
    cachedAt?: SortOrder
  }

  export type CardCacheMinOrderByAggregateInput = {
    scryfallId?: SortOrder
    cachedAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type DeckCardCreateNestedManyWithoutDeckInput = {
    create?: XOR<DeckCardCreateWithoutDeckInput, DeckCardUncheckedCreateWithoutDeckInput> | DeckCardCreateWithoutDeckInput[] | DeckCardUncheckedCreateWithoutDeckInput[]
    connectOrCreate?: DeckCardCreateOrConnectWithoutDeckInput | DeckCardCreateOrConnectWithoutDeckInput[]
    createMany?: DeckCardCreateManyDeckInputEnvelope
    connect?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
  }

  export type DeckCardUncheckedCreateNestedManyWithoutDeckInput = {
    create?: XOR<DeckCardCreateWithoutDeckInput, DeckCardUncheckedCreateWithoutDeckInput> | DeckCardCreateWithoutDeckInput[] | DeckCardUncheckedCreateWithoutDeckInput[]
    connectOrCreate?: DeckCardCreateOrConnectWithoutDeckInput | DeckCardCreateOrConnectWithoutDeckInput[]
    createMany?: DeckCardCreateManyDeckInputEnvelope
    connect?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type DeckCardUpdateManyWithoutDeckNestedInput = {
    create?: XOR<DeckCardCreateWithoutDeckInput, DeckCardUncheckedCreateWithoutDeckInput> | DeckCardCreateWithoutDeckInput[] | DeckCardUncheckedCreateWithoutDeckInput[]
    connectOrCreate?: DeckCardCreateOrConnectWithoutDeckInput | DeckCardCreateOrConnectWithoutDeckInput[]
    upsert?: DeckCardUpsertWithWhereUniqueWithoutDeckInput | DeckCardUpsertWithWhereUniqueWithoutDeckInput[]
    createMany?: DeckCardCreateManyDeckInputEnvelope
    set?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    disconnect?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    delete?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    connect?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    update?: DeckCardUpdateWithWhereUniqueWithoutDeckInput | DeckCardUpdateWithWhereUniqueWithoutDeckInput[]
    updateMany?: DeckCardUpdateManyWithWhereWithoutDeckInput | DeckCardUpdateManyWithWhereWithoutDeckInput[]
    deleteMany?: DeckCardScalarWhereInput | DeckCardScalarWhereInput[]
  }

  export type DeckCardUncheckedUpdateManyWithoutDeckNestedInput = {
    create?: XOR<DeckCardCreateWithoutDeckInput, DeckCardUncheckedCreateWithoutDeckInput> | DeckCardCreateWithoutDeckInput[] | DeckCardUncheckedCreateWithoutDeckInput[]
    connectOrCreate?: DeckCardCreateOrConnectWithoutDeckInput | DeckCardCreateOrConnectWithoutDeckInput[]
    upsert?: DeckCardUpsertWithWhereUniqueWithoutDeckInput | DeckCardUpsertWithWhereUniqueWithoutDeckInput[]
    createMany?: DeckCardCreateManyDeckInputEnvelope
    set?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    disconnect?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    delete?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    connect?: DeckCardWhereUniqueInput | DeckCardWhereUniqueInput[]
    update?: DeckCardUpdateWithWhereUniqueWithoutDeckInput | DeckCardUpdateWithWhereUniqueWithoutDeckInput[]
    updateMany?: DeckCardUpdateManyWithWhereWithoutDeckInput | DeckCardUpdateManyWithWhereWithoutDeckInput[]
    deleteMany?: DeckCardScalarWhereInput | DeckCardScalarWhereInput[]
  }

  export type DeckCardCreatecolorIdentityInput = {
    set: string[]
  }

  export type DeckCreateNestedOneWithoutCardsInput = {
    create?: XOR<DeckCreateWithoutCardsInput, DeckUncheckedCreateWithoutCardsInput>
    connectOrCreate?: DeckCreateOrConnectWithoutCardsInput
    connect?: DeckWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DeckCardUpdatecolorIdentityInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DeckUpdateOneRequiredWithoutCardsNestedInput = {
    create?: XOR<DeckCreateWithoutCardsInput, DeckUncheckedCreateWithoutCardsInput>
    connectOrCreate?: DeckCreateOrConnectWithoutCardsInput
    upsert?: DeckUpsertWithoutCardsInput
    connect?: DeckWhereUniqueInput
    update?: XOR<XOR<DeckUpdateToOneWithWhereWithoutCardsInput, DeckUpdateWithoutCardsInput>, DeckUncheckedUpdateWithoutCardsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DeckCardCreateWithoutDeckInput = {
    id?: string
    scryfallId: string
    name: string
    manaCost?: string
    cmc?: number
    typeLine?: string
    oracleText?: string
    colorIdentity?: DeckCardCreatecolorIdentityInput | string[]
    isGameChanger?: boolean
    isBanned?: boolean
    price?: number | null
    imageUri?: string
    artCropUri?: string
    category?: string
    quantity?: number
    isCommander?: boolean
    isPartner?: boolean
  }

  export type DeckCardUncheckedCreateWithoutDeckInput = {
    id?: string
    scryfallId: string
    name: string
    manaCost?: string
    cmc?: number
    typeLine?: string
    oracleText?: string
    colorIdentity?: DeckCardCreatecolorIdentityInput | string[]
    isGameChanger?: boolean
    isBanned?: boolean
    price?: number | null
    imageUri?: string
    artCropUri?: string
    category?: string
    quantity?: number
    isCommander?: boolean
    isPartner?: boolean
  }

  export type DeckCardCreateOrConnectWithoutDeckInput = {
    where: DeckCardWhereUniqueInput
    create: XOR<DeckCardCreateWithoutDeckInput, DeckCardUncheckedCreateWithoutDeckInput>
  }

  export type DeckCardCreateManyDeckInputEnvelope = {
    data: DeckCardCreateManyDeckInput | DeckCardCreateManyDeckInput[]
    skipDuplicates?: boolean
  }

  export type DeckCardUpsertWithWhereUniqueWithoutDeckInput = {
    where: DeckCardWhereUniqueInput
    update: XOR<DeckCardUpdateWithoutDeckInput, DeckCardUncheckedUpdateWithoutDeckInput>
    create: XOR<DeckCardCreateWithoutDeckInput, DeckCardUncheckedCreateWithoutDeckInput>
  }

  export type DeckCardUpdateWithWhereUniqueWithoutDeckInput = {
    where: DeckCardWhereUniqueInput
    data: XOR<DeckCardUpdateWithoutDeckInput, DeckCardUncheckedUpdateWithoutDeckInput>
  }

  export type DeckCardUpdateManyWithWhereWithoutDeckInput = {
    where: DeckCardScalarWhereInput
    data: XOR<DeckCardUpdateManyMutationInput, DeckCardUncheckedUpdateManyWithoutDeckInput>
  }

  export type DeckCardScalarWhereInput = {
    AND?: DeckCardScalarWhereInput | DeckCardScalarWhereInput[]
    OR?: DeckCardScalarWhereInput[]
    NOT?: DeckCardScalarWhereInput | DeckCardScalarWhereInput[]
    id?: StringFilter<"DeckCard"> | string
    deckId?: StringFilter<"DeckCard"> | string
    scryfallId?: StringFilter<"DeckCard"> | string
    name?: StringFilter<"DeckCard"> | string
    manaCost?: StringFilter<"DeckCard"> | string
    cmc?: FloatFilter<"DeckCard"> | number
    typeLine?: StringFilter<"DeckCard"> | string
    oracleText?: StringFilter<"DeckCard"> | string
    colorIdentity?: StringNullableListFilter<"DeckCard">
    isGameChanger?: BoolFilter<"DeckCard"> | boolean
    isBanned?: BoolFilter<"DeckCard"> | boolean
    price?: FloatNullableFilter<"DeckCard"> | number | null
    imageUri?: StringFilter<"DeckCard"> | string
    artCropUri?: StringFilter<"DeckCard"> | string
    category?: StringFilter<"DeckCard"> | string
    quantity?: IntFilter<"DeckCard"> | number
    isCommander?: BoolFilter<"DeckCard"> | boolean
    isPartner?: BoolFilter<"DeckCard"> | boolean
  }

  export type DeckCreateWithoutCardsInput = {
    id?: string
    name: string
    format?: string
    targetBracket?: number
    budget?: number | null
    commanderId?: string | null
    partnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DeckUncheckedCreateWithoutCardsInput = {
    id?: string
    name: string
    format?: string
    targetBracket?: number
    budget?: number | null
    commanderId?: string | null
    partnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DeckCreateOrConnectWithoutCardsInput = {
    where: DeckWhereUniqueInput
    create: XOR<DeckCreateWithoutCardsInput, DeckUncheckedCreateWithoutCardsInput>
  }

  export type DeckUpsertWithoutCardsInput = {
    update: XOR<DeckUpdateWithoutCardsInput, DeckUncheckedUpdateWithoutCardsInput>
    create: XOR<DeckCreateWithoutCardsInput, DeckUncheckedCreateWithoutCardsInput>
    where?: DeckWhereInput
  }

  export type DeckUpdateToOneWithWhereWithoutCardsInput = {
    where?: DeckWhereInput
    data: XOR<DeckUpdateWithoutCardsInput, DeckUncheckedUpdateWithoutCardsInput>
  }

  export type DeckUpdateWithoutCardsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    format?: StringFieldUpdateOperationsInput | string
    targetBracket?: IntFieldUpdateOperationsInput | number
    budget?: NullableFloatFieldUpdateOperationsInput | number | null
    commanderId?: NullableStringFieldUpdateOperationsInput | string | null
    partnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeckUncheckedUpdateWithoutCardsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    format?: StringFieldUpdateOperationsInput | string
    targetBracket?: IntFieldUpdateOperationsInput | number
    budget?: NullableFloatFieldUpdateOperationsInput | number | null
    commanderId?: NullableStringFieldUpdateOperationsInput | string | null
    partnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeckCardCreateManyDeckInput = {
    id?: string
    scryfallId: string
    name: string
    manaCost?: string
    cmc?: number
    typeLine?: string
    oracleText?: string
    colorIdentity?: DeckCardCreatecolorIdentityInput | string[]
    isGameChanger?: boolean
    isBanned?: boolean
    price?: number | null
    imageUri?: string
    artCropUri?: string
    category?: string
    quantity?: number
    isCommander?: boolean
    isPartner?: boolean
  }

  export type DeckCardUpdateWithoutDeckInput = {
    id?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
  }

  export type DeckCardUncheckedUpdateWithoutDeckInput = {
    id?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
  }

  export type DeckCardUncheckedUpdateManyWithoutDeckInput = {
    id?: StringFieldUpdateOperationsInput | string
    scryfallId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    manaCost?: StringFieldUpdateOperationsInput | string
    cmc?: FloatFieldUpdateOperationsInput | number
    typeLine?: StringFieldUpdateOperationsInput | string
    oracleText?: StringFieldUpdateOperationsInput | string
    colorIdentity?: DeckCardUpdatecolorIdentityInput | string[]
    isGameChanger?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    price?: NullableFloatFieldUpdateOperationsInput | number | null
    imageUri?: StringFieldUpdateOperationsInput | string
    artCropUri?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    isCommander?: BoolFieldUpdateOperationsInput | boolean
    isPartner?: BoolFieldUpdateOperationsInput | boolean
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}