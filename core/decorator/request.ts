import { MetaDataType } from "./type"

export function Request(path: string, method: 'GET' | 'POST'): MethodDecorator {
    return (target, key) => {
        const routes = Object.assign({}, Reflect.getMetadata(MetaDataType.REQUEST_PATH, target) ?? {}, {
            [path]: {
                method,
                key
            }
        }) 
        Reflect.defineMetadata(MetaDataType.REQUEST_PATH, routes, target)
    }
}

export const Get = (path: string) => Request(path, 'GET')
export const Post = (path: string) => Request(path, 'POST')