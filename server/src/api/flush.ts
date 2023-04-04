import {env} from "../Environment";
import {CallableContext} from "../http/CallableContext";
import {getUserId} from "../http/AuthUtils";
import {ServerAction} from "../ServerAction";

export const flush: ServerAction<'flush'> = async (context: CallableContext) => {
  const userId = getUserId(context);

  // TODO(acorn1010): Allow partial cache invalidations (e.g. "com.*", "com.foony.*").
  const result = await env.redis.url.flush(userId);
  console.log('Deleted all cache for user!', userId, result);
  return true;
};
