import { Context, Next } from 'koa'
import CryptoJS from 'crypto-js'

declare interface Result<T> {
    items: T[],
    fields: any
}

declare interface PoolConfig {
    host: string,
    port: number,
    database: string,
    user: string,
    password: string,
    connectionLimit: number
}

declare type Constructor<T> = new (...args: any[]) => T
declare type AppPlugins = ((ctx: Context, next: Next) => Promise<any> | any)[]
declare type AppPluginsNoNext = ((ctx: Context) => Promise<any> | any)[]
declare type ParamHandler = (p: { ctx: Context, type: string, key: string }) => any
declare type PropHandler = (p: { ctx: Context, type: string, key: string }) => any

declare interface CreamOptions {
    controller: Constructor<any>[],
    // provider: Constructor<any>[],
    plugin?: AppPluginsNoNext,
    middleware?: AppPlugins
}

declare interface Cache {
    get: <T>(k: string) => T | null
    set: <T>(k: string, v: T) => void
    del: () => void
}

declare interface CacheOptions {
    stdTtl?: number,
    checkTime?: number
}

declare interface CreamConfig {
    port: number
    database?: PoolConfig
}

declare class Container {
    private readonly dependencies: Map<Constructor<any>, any>

    register<T>(constructor: Constructor<T>): void

    resolve<T>(constructor: Constructor<T>): T
}

declare class Cream {
    constructor(options: CreamOptions)

    getContainer(): Container

    getRouter(): Map<string, Constructor<any>>

    useParamHandler(process: ParamHandler): void

    usePropHandler(process: PropHandler): void

    bootstrap(config: CreamConfig): void
}

declare const tools: {
    crypto: {
        aesEncrypt: (origin: string, key: string) => string
        aesDecrypt: (origin: string, key: string) => string
        base64Decode: (origin: string) => string
        base64Encode: (origin: string) => string
        md5: (origin: string) => string
        proto: CryptoJS
    }
    mime: {
        getType(path: string): string | null
        getExtension(mime: string): string | null
        define(typeMap: any, force?: boolean): void
    }
    generalUUID(length?: number): string
    date: {
        toString(date?: Date | null, divider?: string): string
        toDetailString(date?: Date | null, divider?: string): string
        toChineseString(date?: Date): string
        get(offset?: number): Date
    }
    checkParam(target: Record<string, string>, required: string[]): boolean
    getCurrentDateString(): string
    generalUUID(length?: number): string
}

declare interface DataBaseTable {
    fetch<T extends object>(items: (keyof T)[], conditions: Record<string, any>[]): Promise<Result<T>>

    put<T extends object>(entity: T): Promise<Result<object>>

    remove(conditions: Record<string, any>): Promise<object>

    update<T extends object>(entity: T, conditions: Record<string, any>[]): Promise<object>
}

declare class DataBase {
    constructor(config: PoolConfig)

    query<T extends object>(statement: string, ...args: any[]): Promise<Result<T>>

    getBase(table: string): DataBaseTable
}

declare interface ParamType {
    index: number
    type: string
    key: string
}

declare function Param(key: string, type: string): ParameterDecorator

declare const Query: (key: string) => ParameterDecorator
declare const File: (key: string) => ParameterDecorator
declare const Field: (key: string) => ParameterDecorator
declare const QueryMap: ParameterDecorator
declare const Fields: ParameterDecorator

declare interface PropType {
    propKey: string
    value: string
    type: string
}

declare function Property(value: string, type: string): PropertyDecorator

declare const Database: PropertyDecorator
declare const Table: (value: string) => PropertyDecorator

declare function Request(path: string, method: 'GET' | 'POST'): MethodDecorator

declare const Get: (path: string) => MethodDecorator
declare const Post: (path: string) => MethodDecorator

declare function Controller(path: string): ClassDecorator

declare const Injectable: ClassDecorator

declare namespace ChunkResult {
    export type file = {
        filename: string,
        buffer: Buffer,
        encoding: BufferEncoding,
        mimeType: string
    }
    export type files = Record<string, file>
    export type fields = Record<string, string>
}

declare class CommonResult {
    constructor(value: any)
    get headers(): Record<string, string>
    set headers(value: Record<string, string>)
    get value(): any
    set value(v: any)
}