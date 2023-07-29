import { Context, Next } from "koa"
import { Constructor, Container } from "."
import { AppPlugins, AppPluginsNoNext, Application } from "../application"
import { DataBase, PoolConfig } from "../database"
import { ParamType } from "../decorator/param"
import { PropType } from "../decorator/property"
import { MetaDataType } from "../decorator/type"
import { errorMap, response } from "../response"
import { handler } from "../handler"
import { CommonResult } from "../response/common"

export interface CreamOptions {
    controller: Constructor<any>[],
    plugin?: AppPluginsNoNext,
    middleware?: AppPlugins
}
export interface CreamConfig {
    port: number
    base?: string
    database?: PoolConfig
}
export type ParamHandler = (p: { ctx: Context, type: string, key: string }) => any
export type PropHandler = (p: { ctx: Context, type: string, key: string }) => any

export class Cream {
    constructor(private options: CreamOptions) {
        const ioc = this.ioc
        const router = this.router
        options.controller.forEach(item => {
            ioc.register(item)
            router.set(Reflect.getMetadata(MetaDataType.CONTROLLER_PATH, item), item)
        }) // Register Controller
    }

    getContainer() {
        return this.ioc
    }
    getRouter() {
        return this.router
    }

    useParamHandler(process: ParamHandler) {
        this.paramHandler.push(process)
    }
    usePropHandler(process: PropHandler) {
        this.propHandler.push(process)
    }

    /** Start Server */
    bootstrap(config: CreamConfig) {
        if (config.database) this.db = new DataBase(config.database)
        this.base = config.base ?? '/'
        const app = new Application([...(this.options?.middleware || []), this.requestHandler.bind(this)])
        app.listen(config.port, () => {
            console.info('=== Cream Server V3.2 ===')
            console.info('For more information, please visit: https://github.com/CilantroPepper/cream\n')
            console.info(`Server started successfully! Listening... http://localhost:${config.port}${this.base}`)
        })
    }
    private readonly ioc = new Container()
    private db: DataBase | null = null
    private base: string = '/'
    private readonly router = new Map<string, Constructor<any>>()
    private readonly paramHandler: ParamHandler[] = []
    private readonly propHandler: PropHandler[] = []
    private async requestHandler(ctx: Context, next: Next) {
        try {
            await next()
            handler.access(ctx)
            const data: CommonResult = await this.handler.call(this, ctx)
            response.success(ctx, data)
        } catch (e: any) {
            handler.error(e)
            const res = CommonResult.fail({ msg: e?.msg, code: e?.code })
            response.fail(ctx, res)
        }
    }

    private async handler(ctx: Context) {
        try {
            for (let plugin of (this.options?.plugin ?? [])) await plugin?.(ctx)
        } catch (error: any) {
            if (error?.code === 200) return error // Can be the response
            else throw error
        } const router = this.router
        let path: string | undefined
        // Cut the path
        const regExp = new RegExp(`^${this.base}(?<path>\\S*)`, 'g')
        if ((path = regExp.exec(ctx.path)?.groups?.path) === void 0) {
            throw { code: 404, data: null, msg: 'Not Found', name: ctx.path }
        }
        path = '/' + path
        ctx.path = path
        const unitList = path.split('/').map(item => item.trim())
        let unit = ''
        let index: any = 0
        let controller: Constructor<any> | null = null
        for (let idx in unitList) {
            if (unit[unit.length - 1] !== '/') unit += '/'
            unit += unitList[idx]
            index = idx
            if (controller = router.get(unit) ?? null) break
        }
        if (!controller) throw { code: 404, data: null, msg: 'Not Found', name: ctx.path }
        unit = '/' + unitList.slice(Number(index) + 1).filter(item => item.length > 0).join('/')
        const routes: Record<string, any> = Reflect.getMetadata(MetaDataType.REQUEST_PATH, controller.prototype)
        let key: string | null = null
        if (routes?.[unit]) key = unit
        else {
            for (let k of Object.keys(routes)) {
                if (new RegExp(`^${k}$`, 'g').test(unit + '/')) {
                    key = k
                    break
                }
            }
        }
        if (!key) throw { code: 404, data: null, msg: 'Not Found', name: ctx.path }
        if (ctx.method.toUpperCase() === 'OPTIONS') return 'ok'
        if (!routes[key].method?.includes(ctx.method.toUpperCase())) throw { code: 503, data: null, msg: 'Forbidden', name: ctx.path }
        const instance = this.ioc.resolve(controller)
        const route = instance?.[routes[key].key]
        const params: ParamType[] = Reflect.getMetadata(MetaDataType.INJECT_PARAM, route) ?? []
        const paramsMap: Record<string, string | undefined | string[] | null> = {}
        const paramInjection = params?.sort((a, b) => a.index - b.index)?.map(param => {
            if (param.type === 'query') {
                paramsMap[param.key] = ctx.query[param.key]
                return paramsMap[param.key]
            }
            if (param.type === 'field') {
                paramsMap[param.key] = ctx.fields?.[param.key]
                return paramsMap[param.key]
            }
            if (param.type === 'file') {
                paramsMap[param.key] = ctx.files?.[param.key]
                return paramsMap[param.key]
            }
            if (param.type === 'fields') return ctx.fields ?? {}
            if (param.type === 'queryMap') return ctx?.query ?? {}
            paramsMap[param.key] = this.paramHandler?.reduce((pre, cur) => pre ? pre : cur?.({ ctx, type: param.type, key: param.key }), null)
            return paramsMap[param.key]
        })
        const requiredParams: string[] = Reflect.getMetadata(MetaDataType.REQUIRED_PARAM, route) ?? []
        for (const param of requiredParams) {
            if (!paramsMap[param]) {
                throw { code: errorMap.RequestError[0], msg: `Require param: ${param}` }
            }
        }
        const props: PropType[] = Reflect.getMetadata(MetaDataType.INJECT_PROP, instance) ?? []
        const propInjection: Record<string, any> = {}
        props.forEach(prop => {
            let value: any = null
            switch (prop.type) {
                case 'table':
                    value = this.db?.getBase(prop.value)
                    break
                case 'database':
                    value = this.db
                    break
                default:
                    value = this.propHandler?.reduce((pre, cur) => pre ? pre : cur?.({ ctx, type: prop.type, key: prop.value }), null)
            }
            propInjection[prop.propKey] = value
        })
        return await route?.call(Object.assign({}, instance, propInjection), ...paramInjection)
    }
}