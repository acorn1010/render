local function generate_api_key(userId, length)
  local charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  local key = ""
  local seed = tonumber(redis.call('TIME')[1])

  -- Get the current time as a string. TIME returns [seconds, microseconds]
  local time = redis.call('TIME')
  local seedStr = userId .. "-" .. time[1] .. time[2]
  -- Hash the seed string and convert to a number
  local seed = tonumber(redis.sha1hex(seedStr):sub(1, 8), 16)
  math.randomseed(seed)

  for i = 1, length do
    local random_index = math.random(1, #charset)
    key = key .. string.sub(charset, random_index, random_index)
  end
  return key
end

local userId = ARGV[1]

local oldToken = redis.call("HGET", "users:" .. userId, "token")

if oldToken then
  redis.call("HDEL", "tokens", cjson.decode(oldToken))
end

-- Create a new token
while true do
  local apiKey = generate_api_key(userId, 24)
  -- This API key isn't in use. Go ahead and set it!
  if not redis.call("HGET", "tokens", apiKey) then
    redis.call("HSET", "tokens", apiKey, userId)
    redis.call("HSET", "users:" .. userId, "token", cjson.encode(apiKey))
    return apiKey
  end
end
