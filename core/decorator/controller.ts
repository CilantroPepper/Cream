import { MetaDataType } from "./type"

export function Controller(path: string): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(MetaDataType.CONTROLLER_PATH, path, target)
    }
}