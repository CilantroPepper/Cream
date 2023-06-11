import { MetaDataType } from "./type"

export function Controller(path: string): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(MetaDataType.CONTROLLER_PATH, path, target)
    }
}
export const Injectable: ClassDecorator = (target) => {
    Reflect.defineMetadata(MetaDataType.PARAM_TYPE, Reflect.getMetadata(MetaDataType.PARAM_TYPE, target), target)
}