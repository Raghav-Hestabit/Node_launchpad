import config from "config";
import jwt from "jsonwebtoken";
import userModel from "../models/user";
import apiError from './apiError';
import responseMessage from '../../assets/responseMessage';

module.exports = {

  async verifyToken(req, res, next) {
    try {

      if (req.headers.token === "") {
        return res.status(401).json({
          responseCode: 401,
          responseMessage: responseMessage.UNAUTHORIZED
        });
      }

      if (req.headers.token) {
        const decodedToken = jwt.verify(req.headers.token, process.env.JWTSECRET);

        if (decodedToken) {
          const result2 = await userModel.findOne({ _id: decodedToken.userId });

          if (!result2) {
            return res.status(404).json({
              responseCode: 404,
              responseMessage: "USER NOT FOUND"
            });
          } else if (result2.status == "BLOCKED") {
            return res.status(403).json({
              responseCode: 450,
              responseMessage: "You have been blocked by admin."
            });
          } else if (result2.status == "DELETE") {
            return res.status(402).json({
              responseCode: 440,
              responseMessage: "Your account has been deleted by admin."
            });
          } else {
            req.userId = decodedToken.userId;
            next();
          }
        }
      } else {
        throw apiError.invalid(responseMessage.NO_TOKEN);
      }
    } catch (err) {
      if (err.name == "TokenExpiredError") {
        return res.status(440).send({
          responseCode: 440,
          responseMessage: "Session Expired, Please login again.",
        });
      } else {
        return res.status(401).json({
          responseCode: 401,
          responseMessage: responseMessage.UNAUTHORIZED
        });


      }
    }
  }
};
