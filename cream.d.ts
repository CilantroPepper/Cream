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

    getDataBase(): InstanceType<typeof DataBase>

    bootstrap(config: CreamConfig): void
}

declare const tools: {
    crypto: {
        aesEncrypt: (origin: string, key: string) => string
        aesDecrypt: (origin: string, key: string) => string
        base64Decode: (origin: string) => string
        base64Encode: (origin: string) => string
        md5: (origin: string) => string
        proto: typeof CryptoJS
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
    camelToUnderline(target: string): string
    underlineToCamel(target: string): string
}

declare interface DataBaseTable {
    fetch<T extends object>(items: (keyof T)[], conditions: Record<string, any>[], attachment?: Record<'ODER BY' | 'SORT BY' , 'LIMIT', string[]>): Promise<Result<T>>

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

declare const Database: ParameterDecorator
declare const Table: (value: string) => ParameterDecorator

declare function Request(path: string, method: 'GET' | 'POST'): MethodDecorator

declare const Get: (path: string) => MethodDecorator
declare const Post: (path: string) => MethodDecorator

declare function Controller(path: string): ClassDecorator
declare const Required: ParameterDecorator

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
    static ok<T extends object | string | number>(value: T, headers?: Record<string, any>): CommonResult
    static file(value: Buffer, name: string, attachment?: boolean): CommonResult
    static fail(params?: { msg?: string, code?: number }): CommonResult
    private constructor(value: any)
    get headers(): Record<string, string>
    set headers(value: Record<string, string>)
    get value(): any
    set value(v: any)
}

declare const errorMap = {
    RequestError: [400, '发出的请求有错误'],
    NoPermission: [401, '用户没有权限'],
    AccessDeny: [403, '访问被禁止'],
    NotFound: [404, '资源不存在'],
    NotAvailable: [406, '请求不可得'],
    PermanentlyDeleted: [410, '资源被永久删除'],
    ValidationError: [422, '验证错误'],
    InternalError: [500, '服务器内部错误'],
    BadGateway: [502, '网关错误'],
    ServiceNotAvailable: [503, '服务不可用'],
    Timeout: [504, '网关超时'],
    TooLarge: [513, '文件过大'],
}

declare const MetaDataType: {
    PARAM_TYPE: string
    CONTROLLER_PATH: string
    REQUEST_PATH: string
    INJECT_PARAM: string
    INJECT_PROP: string
    REQUIRED_PARAM: string
}