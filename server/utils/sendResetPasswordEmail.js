const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async ({ name, email, token, origin }) => {
  const resetURL = `${origin}/user/reset-password?token=${token}&email=${email}`;
  const message = `<p>please reset password on this link: <a href="${resetURL}">here</a></p>`;
  return sendEmail({
    to: email,
    subject: "reset password",
    html: `<h4>hello, ${name}</h4> ${message}`,
  });
};

module.exports = sendResetPasswordEmail;
