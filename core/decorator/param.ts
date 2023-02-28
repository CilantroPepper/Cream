import { MetaDataType } from "./type"

export interface ParamType {
    index: number;
    type: string;
    key: string;
}
export function Param(key: string, type: string): ParameterDecorator {
    return (target, propKey, index) => {
        const params: ParamType[] = Reflect.getMetadata(MetaDataType.INJECT_PARAM, target[propKey as keyof typeof target]) ?? []
        params.unshift({
            index, type, key
        })
        Reflect.defineMetadata(MetaDataType.INJECT_PARAM, params, target[propKey as keyof typeof target] ?? [])
    }
}

export const Query = (key: string) => Param(key, 'query')
export const File = Param('', 'file')
export const Form = (key: string) => Param(key, 'form')
export const QueryMap = Param('', 'queryMap')
export const FormMap = Param('', 'formMap')