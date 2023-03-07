import mysql, { Pool } from 'mysql2'

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
export interface Base {
    fetch<T extends object>(items: (keyof T)[], conditions: Record<string, any>[]): Promise<Result<T>>
    put<T extends object>(entity: T): Promise<Result<object>>
    remove(conditions: Record<string, any>): Promise<object>
    update<T extends object>(entity: T, conditions: Record<string, any>[]): Promise<object>
}
export class DataBase {
    constructor(private readonly config: PoolConfig) {
        this.pool = mysql.createPool(config)
    }
    private pool: Pool

    private async query<T extends object>(statement: string, ...args: any[]): Promise<Result<T>> {
        try {
            const conn = await this.pool.promise().getConnection()
            await conn.beginTransaction()
            try {
                const [items, fields] = await conn.query(statement, args)
                await conn.commit()
                conn?.release()
                return { items, fields }
            } catch (e) {
                await conn.rollback()
                throw e
            }
        } catch (e) {
            throw new Error(`SQL Error while executing statement: ${statement}\nargs:${args.join(',')}\n${e}`)
        }
    }

    private getMetaOperator(origin: string) {
        if (/\?gt$/g.test(origin)) return '>'
        if (/\?lt$/g.test(origin)) return '<'
        if (/\?gte$/g.test(origin)) return '>='
        if (/\?lte$/g.test(origin)) return '<='
        if (/\?ne$/g.test(origin)) return '<>'
        return '='
    }

    private getMetaKey(origin: string) {
        if (/\?gt|lt|gte|lte|ne$/g.test(origin)) return origin.slice(origin.lastIndexOf('?') + 1)
        return origin
    }

    public getBase(table: string): Base {
        const self = this
        return {
            async fetch<T extends object>(items: (keyof T)[], conditions: Record<string, any>[]) {
                let statement = 'SELECT'
                const args: any[] = []
                if (items.length === 0) statement += ` * FROM ${table} WHERE ${conditions.length === 0 ? '' : '('}`
                else {
                    items.forEach((item, index) => {
                        statement += ` ${item.toString()}${index === items.length - 1 ? ' FROM ' + table + ' WHERE ' + (conditions.length === 0 ? '' : '(') : ','}`
                    })
                }
                conditions.forEach((condition, index) => {
                    statement += '('
                    Object.entries(condition).forEach(item => {
                        statement += ` ${self.getMetaKey(item[0])} ${self.getMetaOperator(item[0])} ? AND`
                        args.push(item[1])
                    })
                    statement = statement.slice(0, -4) + ')'
                    if (index < condition.length - 1) statement += ' OR'
                })
                statement += `${conditions.length === 0 ? '' : ') AND'} DELETED = 0`
                try {
                    return await self.query<T>(statement, ...args)
                } catch (e) {
                    throw e
                }
            },
            async put<T extends object>(entity: T) {
                const itemList: string[] = []
                const valueList: any[] = []
                const placeholder: string[] = []
                Object.entries(entity).forEach(item => {
                    itemList.push(item[0])
                    valueList.push(item[1])
                    placeholder.push('?')
                })
                let statement = `INSERT INTO ${table} (${itemList.join(',')}) VALUES (${placeholder.join(',')})`
                try {
                    return await self.query(statement, ...valueList)
                } catch (e) {
                    throw e
                }
            },
            async remove(conditions: Record<string, any>) {
                const args: any[] = []
                const itemList = Object.entries(conditions).map(item => {
                    args.push(item[1])
                    return `${item[0]} = ?`
                })
                if (itemList.length === 0) throw 'Unsafe Delete'
                const statement = `UPDATE ${table} SET DELETED = 1 WHERE ${itemList.join(',')}`
                try {
                    return await self.query(statement, ...args)
                } catch (e) {
                    throw e
                }
            },
            async update<T extends object>(entity: T, conditions: Record<string, any>[]) {
                const args: any[] = []
                const itemList = Object.entries(entity).map(item => {
                    args.push(item[1])
                    return `${item[0]} = ?`
                })
                let statement = `UPDATE ${table} SET ${itemList.join(',')} WHERE`
                conditions.forEach((condition, index) => {
                    statement += '('
                    Object.entries(condition).forEach(item => {
                        statement += ` ${self.getMetaKey(item[0])} ${self.getMetaOperator(item[0])} ? AND`
                        args.push(item[1])
                    })
                    statement = statement.slice(0, -4) + ')'
                    if (index < condition.length - 1) statement += ' OR'
                })
                statement += `${conditions.length === 0 ? '' : ' AND'} DELETED = 0`
                try {
                    await self.query(statement, ...args)
                } catch (e) {
                    throw e
                }
                return { msg: 'ok' }
            }
        }
    }
}