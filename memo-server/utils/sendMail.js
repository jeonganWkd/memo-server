//메일 보내는 유틸리티
const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWD,
    },
  });

  // send mail with defined transport object
  let message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // plain text body
  };

  const info = await transporter.sendMail(message);

  console.log("이메일로 메세지 보냈다 : ", info.messageId, transporter);
};

module.exports = sendMail;
