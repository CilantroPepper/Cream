import { ParamType } from "./param"
import { MetaDataType } from "./type"

export const Required: ParameterDecorator = (target, key, index) => {
    if (!key) return
    const paramsType: ParamType[] = Reflect.getMetadata(MetaDataType.INJECT_PARAM, target[key as keyof typeof target]) ?? []
    const name = paramsType.find(item => item.index === index)?.key
    if (!name) return
    const current = Reflect.getMetadata(MetaDataType.REQUIRED_PARAM, target[key as keyof typeof target]) ?? []
    current.push(name)
    Reflect.defineMetadata(MetaDataType.REQUIRED_PARAM, current, target[key as keyof typeof target])
}
