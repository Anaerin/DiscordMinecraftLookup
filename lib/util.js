import config from "../config.js";
export function isInGuild(guilds) {
	return !!(guilds.find((elem) => elem.id == config.discordGuildID));
}