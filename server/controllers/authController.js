const User = require("../models/User");
const Token = require("../models/Tokens");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils");
const crypto = require("crypto");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });

  //esse origin tem de ter exatamente o mesma url la no front, quando em production é só trocar essa url para nova
  const origin = "http://localhost:3000";
  console.log(req);
  // checar as rotas
  // const origins = req.get("orogin");
  // console.log("origins:", origins);
  // const protocol = req.protocol;
  // console.log("protocol:", protocol);
  // const host = req.get("host");
  // console.log("host:", host);
  // const forwardedHos = req.get("x-forwarded-host");
  // console.log("forwarded", forwardedHos);
  // const forwardedProtocol = req.get("x-forwarded-proto");
  // console.log("forwardedProtocol", forwardedProtocol);
  //tem outro method para acessar essas prop do req ex: req.headers['prop']

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificatioToken: user.verificationToken,
    origin,
  });

  //send verification token only while testing in postman
  res.status(StatusCodes.CREATED).json({
    msg: `Success, please verify your email`,
  });
};

// Email autenticador
const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.BadRequestError("Provide email");
  }
  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";
  user.save();
  res.status(StatusCodes.OK).json({ msg: `email verified` });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  if (!user.isVerified) {
    throw new CustomError.UnauthenticatedError(
      "Unauthenticate, check your email!"
    );
  }

  const tokenUser = createTokenUser(user);
  //create refresh token, esse refresh token é caso o primeiro cookie expire, dai ele cria outro para o user n ser kikado para fora do site, ALOW MONGODB, arruma isso dai
  let refreshToken = "";

  //check for existing token
  const existingToken = await Token.findOne({ user: user._id });
  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      throw new CustomError.UnauthenticatedError("Invalid Credentials");
    }
    //como criamos um model para os tokens, isso aqui serve para n ficar criando token toda vez que o user logar, ele pegar o refresh quem tem um time maior de duração e usa ele como token
    refreshToken = existingToken.refreshToken;

    attachCookiesToResponse({ res, user: tokenUser, refreshToken });

    res.status(StatusCodes.OK).json({ user: tokenUser });

    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];

  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };
  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError("Valid email please");
  }
  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    //send email
    const origin = "http://localhost:3000";
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
      origin,
    });
    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = passwordToken;
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  }

  res.status(StatusCodes.OK).json({ msg: "check your email" });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  if (!email || !token || !password) {
    throw new CustomError.BadRequestError("provide values please ");
  }
  const user = await User.findOne({ email });
  if (user) {
    const currentDate = new Date();

    if (
      user.password === token &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      console.log(user.password);
      await user.save();
    }
  }

  res.send("password change");
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
