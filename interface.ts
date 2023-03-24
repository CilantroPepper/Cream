import { Context, Next } from 'koa'
export interface Result<T> {
    items: T[],
    fields: any
}
export interface PoolConfig {
    host: string,
    port: number,
    database: string,
    user: string,
    password: string,
    connectionLimit: number
}
export interface Table {
    fetch<T extends object>(items: (keyof T)[], conditions: Record<string, any>[]): Promise<Result<T>>
    put<T extends object>(entity: T): Promise<Result<object>>
    remove(conditions: Record<string, any>): Promise<object>
    update<T extends object>(entity: T, conditions: Record<string, any>[]): Promise<object>
}
export type Constructor<T> = new (...args: any[]) => T
export type AppPlugins = ((ctx: Context, next: Next) => Promise<any> | any)[]
export type AppPluginsNoNext = ((ctx: Context) => Promise<any> | any)[]
export type ParamHandler = (p: { ctx: Context, type: string, key: string }) => any
export type PropHandler = (p: { ctx: Context, type: string, key: string }) => any
export interface CreamOptions {
    controller: Constructor<any>[],
    provider: Constructor<any>[],
    plugins?: AppPluginsNoNext,
    midware?: AppPlugins
}
export interface Cache {
    get: <T>(k: string) => T | null;
    set: <T>(k: string, v: T) => void;
    del: () => void
}
export interface CacheOptions {
    stdTtl?: number,
    checkTime?: number
}
export interface CreamConfig {
    port: number;
    database: PoolConfig;
}