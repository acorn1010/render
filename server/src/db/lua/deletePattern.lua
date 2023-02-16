local cursor = "0"
local pattern = ARGV[1]
local count = 1000
local keysDeleted = 0

repeat
  local res = redis.call("SCAN", cursor, "MATCH", pattern, "COUNT", count)
  cursor = res[1]
  local keys = res[2]

  if #keys > 0 then
    redis.call("DEL", unpack(keys))
  end
  keysDeleted = keysDeleted + #keys
until cursor == "0"

return keysDeleted
