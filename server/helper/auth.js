import jwt from "jsonwebtoken";
import userModel from "../models/user";
import responseMessage from '../../assests/responseMessage';

const sendResponse = (res, status, responseCode, responseMessage) => {
  return res.status(status).json({
    responseCode,
    responseMessage,
  });
};

module.exports = {
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.token;

      if (!token) {
        return sendResponse(res, 401, 401, responseMessage.UNAUTHORIZED);
      }

      const decodedToken = jwt.verify(token, process.env.JWTSECRET);
      const user = await userModel.findOne({ _id: decodedToken.userId });

      if (!user) {
        return sendResponse(res, 404, 404, responseMessage.USER_NOT_FOUND);
      }

      switch (user.status) {
        case "BLOCKED":
          return sendResponse(res, 403, 450, responseMessage.BLOCK_BY_ADMIN);
        case "DELETE":
          return sendResponse(res, 402, 440, responseMessage.DELETE_BY_ADMIN);
        default:
          req.userId = decodedToken.userId;
          next();
      }
    } catch (err) {
      const responseCode = err.name === "TokenExpiredError" ? 440 : 401;
      const responseMessageText = err.name === "TokenExpiredError" ? responseMessage.SESSION_EXPIRED : responseMessage.UNAUTHORIZED;
      return sendResponse(res, responseCode, responseCode, responseMessageText);
    }
  }
};
