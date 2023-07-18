const jwt = require("jsonwebtoken");

const createJWT = ({ payload }) => {
  // removerei o lifetime do jwt, pois não precisamos mais graças aos cookies
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET /*{
    expiresIn: process.env.JWT_LIFETIME,
  }*/
  );
  return token;
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

//como vamos mudar o aproach dos cookies, temos de mudar esse o atach cookie tambem, pois agora tem 2

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { user } });
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

  const oneHour = 1000 * 60 * 60;
  const longest = 1000 * 60 * 60 * 24 * 10;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    expires: new Date(Date.now() + oneHour),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    expires: new Date(Date.now() + longest),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};

// const attachSingliCookiesToResponse = ({ res, user }) => {
//   const token = createJWT({ payload: user });

//   const oneDay = 1000 * 60 * 60 * 24;

//   res.cookie("token", token, {
//     httpOnly: true,
//     expires: new Date(Date.now() + oneDay),
//     secure: process.env.NODE_ENV === "production",
//     signed: true,
//   });
// };

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
