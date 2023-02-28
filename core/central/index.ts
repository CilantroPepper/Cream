import { MetaDataType } from "../decorator/type"

export type Constructor<T> = new (...args: any[]) => T
export class Container {
    private readonly dependencies = new Map<Constructor<any>, any>()

    register<T>(constructor: Constructor<T>): void {
        const dependencies: Constructor<any>[] = Reflect.getMetadata(MetaDataType.PARAM_TYPE, constructor) ?? []
        const instances = dependencies.map(dependency => this.resolve(dependency))
        this.dependencies.set(constructor, new constructor(...instances))
    }

    resolve<T>(constructor: Constructor<T>): T {
        const instance = this.dependencies.get(constructor)
        if (!instance) throw new Error(`Cannot resolve dependency: ${constructor}`)
        return instance
    }
}