import {Actions} from "render-shared-library/lib/Action";
import {CallableContext} from "./http/CallableContext";

type Promisable<T> = T | Promise<T>;

export type ServerAction<K extends keyof Actions> =
    ((context: CallableContext, ...args: Actions[K]['input']) => Promisable<Actions[K]['output']>);
