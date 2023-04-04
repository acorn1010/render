import {Actions} from "render-shared-library/lib/Action";
import {ServerAction} from "../ServerAction";
import {flush} from "./flush";

/**
 * All API server actions. When you add an action in shared/Action.ts, you'll need to add it here
 * too. The client calls these methods by using `call.flush()`
 */
export const ServerActions = {
  flush,
} satisfies {[K in keyof Actions]: ServerAction<K>};
