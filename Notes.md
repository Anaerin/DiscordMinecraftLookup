Important URLs
==============

Discord
-------

`GET https://discord.com/api/users/@me`: Retrieves the user object, requires `identity` scope:
```json
{
  "id": "80351110224678912",
  "username": "Nelly",
  "discriminator": "1337",
  "avatar": "8342729096ea3675442027381ff50dfe",
  "bot?": false, // Is a bot
  "system?": false, // Is an Official discord system user
  "mfa_enabled?": false, // 2-factor enabled?
  "locale?": "en", // User's language
  "verified?": true, // User's e-mail is verified?
  "email?": "nelly@discord.com",
  "flags": 64,
  "premium_type?": 1,
  "public_flags?": 64
}
```
`GET https://discord.com/api/users/@me/guilds`: Retrieves "partial" guild objects user is a member of. Requires `guilds` scope
```json
{
  "id": "80351110224678912",
  "name": "1337 Krew",
  "icon": "8342729096ea3675442027381ff50dfe",
  "owner": true,
  "permissions": 36953089
}
```

Minecraft
---------
`GET https://api.mojang.com/users/profiles/minecraft/<username>`: Returns the UUID for the player currently using the name `<username>`:
```json
{
  "id": "7125ba8b1c864508b92bb5c042ccfe2b",
  "name": "KrisJelbring"
}
```
