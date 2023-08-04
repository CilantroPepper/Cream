import { Constructor } from "../../cream"
import { MetaDataType } from "./type"

export interface ParamType {
    index: number
    type: string
    key: string
    constructor: Constructor<any>
}
export function Param(key: string, type: string): ParameterDecorator {
    return (target, propKey, index) => {
        const params: ParamType[] = Reflect.getMetadata(MetaDataType.INJECT_PARAM, target, propKey as any) ?? []
        const types = Reflect.getMetadata(MetaDataType.PARAM_TYPE, target, propKey as any) ?? []
        params.unshift({
            index, type, key, constructor: types[index]
        })
        Reflect.defineMetadata(MetaDataType.INJECT_PARAM, params, target, propKey as any)
    }
}

export const Query = (key: string) => Param(key, 'query')
export const File = (key: string) => Param(key, 'file')
export const Field = (key: string) => Param(key, 'field')
export const QueryMap = Param('', 'queryMap')
export const Fields = Param('', 'fields')