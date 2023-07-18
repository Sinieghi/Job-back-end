const nodemailer = require("nodemailer");
const nodemailerConfig = require("./nodeMailerConfig");
const sendEmail = async ({ to, subject, html }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(nodemailerConfig);

  const info = await transporter.sendMail({
    from: '"Fred Foo 👻" <onFire@gmail.com>', // sender address
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
