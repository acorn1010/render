import {env} from "../Environment";
import {CallableContext} from "../http/CallableContext";
import {getUserId} from "../http/AuthUtils";
import {ServerAction} from "../ServerAction";

export const getMonthlyRenderCounts: ServerAction<'getMonthlyRenderCounts'> = async (context: CallableContext) => {
  const userId = getUserId(context);
  console.log('userId', userId);

  // TODO(acorn1010): Allow partial cache invalidations (e.g. "com.*", "com.foony.*").
  return env.redis.user.getMonthlyRenderCounts('jellybean');
};
