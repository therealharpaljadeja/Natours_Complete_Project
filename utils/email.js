const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

class Email {
	constructor(user, url){
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.from = `Harpalsinh Jadeja <${process.env.EMAIL_FROM}>`;
	}

	newTransport() {
		if(process.env.NODE_ENV === 'production'){
			// sendgrid
			return 1;
		}

		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT, 
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		})
	}

	async send(template, subject) {
		// Send the actual email.
		const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
			firstName: this.firstName,
			url: this.url,
			subject: subject
		});

		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: subject,
			html: html,
			text: htmlToText.fromString(html)
		}
		
		await this.newTransport().sendMail(mailOptions);;
		
	}

	async sendWelcome() {
		await this.send('welcome', 'Welcome to the Natours Family!!!');
	}

	async sendPasswordReset(){
		await this.send('passwordReset', 'Your Password Reset Token (valid for only 10 mins)');
	} 
}


module.exports = Email;