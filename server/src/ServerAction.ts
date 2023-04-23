import {Actions} from "@shared/Action";
import {CallableContext} from "./http/CallableContext";

type Promisable<T> = T | Promise<T>;

export type ServerAction<K extends keyof Actions> =
    ((context: CallableContext, ...args: Actions[K]['input']) => Promisable<Actions[K]['output']>);
