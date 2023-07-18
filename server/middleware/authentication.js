// Assiste a aula sobre esse cookier refactor, não vai tentar as cegas, tem muita coisa
const CustomError = require("../errors");
const { isTokenValid, attachCookiesToResponse } = require("../utils");
const Token = require("../models/Tokens");

//teve um refact na func do authenticateUser, pois agora temos 2 cookies
const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;
  try {
    //caso o access token não tenha expirado
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.user;

      return next();
    }
    //caso o accessToken tenho expierado usaremos o refresh, para renovar o access

    const payload = isTokenValid(refreshToken);

    console.log(payload);
    const existingToken = await Token.findOne({
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken?.isValid) {
      throw new CustomError.UnauthenticatedError("Authentication Invalid");
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });

    req.user = payload.user;
    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
