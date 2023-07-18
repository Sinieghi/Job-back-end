const sendEmail = require("./sendEmail");

const sendVerificationEmail = async ({
  name,
  email,
  verificatioToken,
  origin,
}) => {
  //essa rota e extremamente importante estar igual no front-end, as duas tem de coincidir
  const verifyEmail = `${origin}/user/verify-email?token=${verificatioToken}&email=${email}`;

  const message = `<p>Please confirme your email: <a href="${verifyEmail}">verify</a></p>`;
  return sendEmail({
    to: email,
    subject: "Confirmation email",
    html: `<h4>hello, ${name}</h4> ${message}`,
  });
};

module.exports = sendVerificationEmail;
