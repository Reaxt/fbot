module.exports = async function(db) {
	await db.query('CREATE TABLE IF NOT EXISTS commands ("id" BIGINT PRIMARY KEY NOT NULL, "command" TEXT NOT NULL, "userid" BIGINT NOT NULL, "channelid" BIGINT NOT NULL, "serverid" BIGINT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS messages ("id" BIGINT PRIMARY KEY NOT NULL, "userid" BIGINT NOT NULL, "channelid" BIGINT NOT NULL, "serverid" BIGINT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS stats ("servers" BIGINT NOT NULL, "channels" BIGINT NOT NULL, "users" BIGINT NOT NULL, "messages" BIGINT NOT NULL, "commands" BIGINT NOT NULL, "aimessages" BIGINT NOT NULL, "dbsize" BIGINT NOT NULL, "time" BIGINT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS settings ("server" BIGINT NOT NULL, "setting" TEXT NOT NULL, "value" TEXT)');
	await db.query('CREATE TABLE IF NOT EXISTS ai ("id" BIGINT PRIMARY KEY NOT NULL, "message" TEXT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS blacklists ("type" TEXT NOT NULL, "id" BIGINT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS songs ("id" TEXT NOT NULL, "userid" BIGINT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS users ("id" BIGINT NOT NULL, "password" TEXT NOT NULL)');
	await db.query('CREATE TABLE IF NOT EXISTS tokens ("token" TEXT NOT NULL, "userid" BIGINT NOT NULL, "expiration" BIGINT NOT NULL)');
};
