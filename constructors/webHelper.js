const https = require('https');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const botCfg = require('../configs/bot.json');

class WebHelper {

	constructor(shardManager, db) {
		this.shardManager = shardManager;
		this.db = db;
		this.commands = this.indexCommands();
		this.utils = this.createUtilityFunctions();
	}

	listen() {
		app.use(express.static('./web/'));
		app.use(bodyParser.json());

		app.get('/api/stats', async(req, res) => {

			try {
				const stats = await this.db.query('SELECT * FROM stats WHERE time >= $1 ORDER BY time DESC', [Date.now() - 30 * 24 * 60 * 60 * 1000]);
				res.end(JSON.stringify(stats.rows));
			} catch(err) {
				res.status(500);
				res.end(err.message);
			}

		});

		app.get('/api/bot', async(req, res) => {

			try {
				let guilds = await this.shardManager.fetchClientValues('guilds.size');
				let users = await this.shardManager.fetchClientValues('users.size');
				let channels = await this.shardManager.fetchClientValues('channels.size');
				guilds = guilds.reduce((all, val) => all + val, 0);
				users = users.reduce((all, val) => all + val, 0);
				channels = channels.reduce((all, val) => all + val, 0);

				res.end(JSON.stringify({
					guilds: guilds,
					users: users,
					channels: channels
				}));
			} catch(err) {
				res.status(500);

				res.end(JSON.stringify({
					error: err.message
				}));
			}

		});

		app.get('/api/commands', async(req, res) => {

			try {
				res.end(JSON.stringify(this.commands));
			} catch(err) {
				res.status(500);

				res.end(JSON.stringify({
					error: err.message
				}));
			}

		});

		app.post('/api/login', async(req, res) => {
			const userQuery = await this.db.query('SELECT * FROM users WHERE id = $1', [req.body.id || 0]);
			if(userQuery.rowCount === 0) {
				res.status(401);
				return res.end('Invalid Login');
			}

			const user = userQuery.rows[0];
			const match = await bcrypt.compare(req.body.password || '', user.password);
			if(!match) {
				res.status(401);
				return res.end('Invalid Login');
			}

			const token = crypto.createHash('md5').update([user.id, Date.now()].join('&')).digest('hex');
			await this.db.query('INSERT INTO tokens VALUES ($1, $2, $3)', [token, user.id, Date.now() + 7 * 24 * 60 * 60 * 1000]);
			res.end(JSON.stringify({token: token, userID: user.id}));
		});

		app.get('/api/token/:token', async(req, res) => {
			const user = await this.utils.getUserFromToken(req.params.token);
			if(!user) {
				res.status(404);
				return res.send('Invalid Token');
			}

			res.end(JSON.stringify(user));
		});

		app.use('/api', (req, res) => {
			res.status(501);
			res.end('Not Implemented');
		});

		app.use('/pages', (req, res) => {
			res.status(404);
			res.end('Not Found');
		});

		app.use((req, res) => {
			res.status(404);
			res.sendFile(path.resolve('./web/index.html'));
		});

		const server = https.createServer({
			pfx: fs.readFileSync('./certificate.pfx')
		}, app);

		server.listen(botCfg.websitePort);

		setInterval(() => {
			this.commands = this.indexCommands();
		}, 60000);
	}

	indexCommands() {
		const commands = [];

		const loadCommandsIn = (dir) => {
			for(const subName of fs.readdirSync(dir)) {
				if(fs.statSync(path.resolve(dir, subName)).isDirectory()) {
					loadCommandsIn(path.resolve(dir, subName));
				} else {
					let file = path.resolve(dir, subName);
					let name = subName.substring(0, subName.lastIndexOf('.')).toLowerCase();
					if(require.cache[require.resolve(file)]) delete require.cache[require.resolve(file)];

					const command = require(file);
					commands.push({
						name: botCfg.prefix + name,
						description: command.description,
						aliases: command.aliases,
						args: command.args,
						category: command.category
					});
				}
			}
		};

		loadCommandsIn('./commands/');

		return commands;
	}

	createUtilityFunctions() {
		const getUserFromToken = async(token) => {
			const tokenQuery = await this.db.query('SELECT * FROM tokens WHERE token = $1', [token]);
			if(tokenQuery.rowCount === 0) return null;
			const tokenObj = tokenQuery.rows[0];
			return {id: tokenObj.userid};
		};

		const verifyToken = async(token) => {
			const tokenQuery = await this.db.query('SELECT count(*) FROM tokens WHERE token = $1', [token]);
			return tokenQuery.rows[0].count > 0;
		};

		return {getUserFromToken: getUserFromToken, verifyToken: verifyToken};
	}

}

module.exports = WebHelper;
