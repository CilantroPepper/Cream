import { MetaDataType } from "./type"

export interface PropType {
    propKey: string;
    value: string;
    type: string;
}
export function Property(value: string, type: string): PropertyDecorator {
    return (target, propKey) => {
        const props = Reflect.getMetadata(MetaDataType.INJECT_PROP, target) ?? []
        props.push({
            propKey,
            value,
            type
        })
        Reflect.defineMetadata(MetaDataType.INJECT_PROP, props, target)
    }
}