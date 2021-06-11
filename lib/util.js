import config from "../config.js";
export function isInGuild(user) {
	return !!(user?.discordUser?.guilds.find((elem) => elem.id == config.discordGuildID));
}