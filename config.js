export default {
	uid: 199,
	gid: 199,
	mcServerPath: "/var/games/minecraft/servers/",
	mcServerName: "SERVER_NAME",
	discordGuildID: "GUILD_ID",
	discordAuth: {
		id: "DISCORD_CLIENT_ID",
		secret: "DISCORD_CLIENT_SECRET"
	},
	discordConfig: {
		redirect_uri: "DISCORD_REDIRECT_URI",
		scope: [
			"identify",
			"guilds"
		]
	}
}
