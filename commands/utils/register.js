const passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');

module.exports = {
	description: 'Registers your user account for the website',
	category: 'Utils',
	cooldown: 5000,
	run: async function(message) {
    await this.utils.queryDB('DELETE FROM users WHERE id = $1', [message.author.id]);
    await this.utils.queryDB('DELETE FROM tokens WHERE userid = $1', [message.author.id]);

    let password = '';
    for(let i = 0; i <= 5; i++) password += passwordChars[Math.floor(Math.random() * passwordChars.length)];

		const hash = await this.bcrypt.hash(password, 10);
    await this.utils.queryDB('INSERT INTO users VALUES ($1, $2)', [message.author.id, hash]);
    await message.channel.send('Check your DMs!');
    message.author.send(`Your account has been registered.\nYour user ID is \`${message.author.id}\`\nYour new password is \`${password}\``);
	}
};
