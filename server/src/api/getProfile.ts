import {env} from "../Environment";
import {CallableContext} from "../http/CallableContext";
import {getUserId} from "../http/AuthUtils";
import {ServerAction} from "../ServerAction";

export const getProfile: ServerAction<'getProfile'> = async (context: CallableContext) => {
  return env.redis.user.get(getUserId(context));
};
