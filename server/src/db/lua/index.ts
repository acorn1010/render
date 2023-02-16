import fs from "fs";

/** Imports a script file from Lua. */
function importFile(path: `./${string}.lua`): string {
  return fs.readFileSync(require.resolve(path)).toString('utf8');
}

/**
 * Deletes cached URLs matching the pattern in ARGV[1]
 *
 * KEYS:
 *   hashtag - {users:$userId}
 * ARGS:
 *   pattern - the URL pattern to delete
 */
export const DELETE_PATTERN = importFile('./deletePattern.lua');
