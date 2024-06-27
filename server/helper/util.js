import config from "config";
import Joi from "joi";
import jwt, { decode } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import cloudinary from 'cloudinary';
const axios = require('axios');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


module.exports = {

  getToken: async (payload) => {
    var token = jwt.sign(payload, process.env.JWTSECRET, { expiresIn: config.get('jwtOptions.expiresIn') })
    return token;
  },

  verifyToken: async (token) => {
    try {
      const verifiedToken = jwt.verify(token, process.env.JWTSECRET);
      return verifiedToken;
    } catch (error) {
      throw new Error('JWT verification failed: ' + error.message);
    }

  },
  sendSms: (number, otp) => {
    let data = JSON.stringify({
      "content": `Enter this code:${otp} to validate your account`,
      "recipient": `91${number}`,
      "sender": "fithun",
      "type": "marketing",
      "webUrl": "http://requestb.in/173lyyx1",
      "unicodeEnabled": true
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.brevo.com/v3/transactionalSMS/sms',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': process.env.BREVO_KEY
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });

  },


  getOTP() {
    var otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  },

  sendMail: async (to, name, otp) => {
    try {
      let textMsg = "Please use the verification code below on the Dream Walk Application:";

      var html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <style>
            img {
              border: none;
              -ms-interpolation-mode: bicubic;
              max-width: 100%;
            }
      
            body {
              background: #f9f9f9 !important;
              font-family: arial, sans-serif;
              -webkit-font-smoothing: antialiased;
              font-size: 15px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              -ms-text-size-adjust: 100%;
              -webkit-text-size-adjust: 100%;
            }
            table {
              border-collapse: separate;
              mso-table-lspace: 0pt;
              width: 100%;
            }
            table td {
              font-family: sans-serif;
              font-size: 15px;
              vertical-align: top;
            }
            .body {
              background-color: #f9f9f9;
              width: 100%;
            }
      
            .container {
              display: block;
              margin: auto !important;
              max-width: 580px;
              padding: 10px;
              width: 580px;
            }
      
            .content {
              box-sizing: border-box;
              display: block;
              margin: 0 auto;
              max-width: 580px;
              padding: 10px;
            }
            .main {
              background: #ffffff;
              width: 100%;
              border: 2px solid #e7ebef;
              border-radius: 10px;
            }
      
            .wrapper {
              box-sizing: border-box;
              padding: 30px;
            }
      
            .content-block {
              padding-bottom: 10px;
              padding-top: 10px;
            }
      
            .footer {
              clear: both;
              margin-top: 5px;
              text-align: center;
              width: 100%;
            }
            .footer td,
            .footer p,
            .footer span,
            .footer a {
              color: #777777;
              font-size: 12px;
              text-align: center;
            }
            h1,
            h2,
            h3,
            h4 {
              color: #000000;
              font-family: arial, sans-serif;
              font-weight: 400;
              line-height: 1.4;
              margin: 0;
              margin-bottom: 30px;
            }
      
            h1 {
              font-size: 26px;
              font-weight: bold;
              text-transform: capitalize;
            }
      
            p,
            ul,
            ol {
              font-family: sans-serif;
              font-size: 15px;
              font-weight: normal;
              margin: 0;
              margin-bottom: 15px;
              color: #333;
            }
            p li,
            ul li,
            ol li {
              list-style-position: inside;
              margin-left: 5px;
            }
      
            a {
              color: #e30d0d;
              text-decoration: underline;
            }
            .btn {
              box-sizing: border-box;
              width: 100%;
              margin-top: 25px;
              margin-bottom: 25px;
            }
            .btn > tbody > tr > td {
              padding-bottom: 15px;
            }
            .btn table {
              width: auto;
            }
            .btn table td {
              background-color: #ffffff;
              border-radius: 30px;
            }
            .btn a {
              background-color: #ffffff;
              border: solid 1px #e30d0d;
              box-sizing: border-box;
              color: #e30d0d;
              cursor: pointer;
              display: inline-block;
              font-size: 14px;
              font-weight: bold;
              margin: 0;
              padding: 12px 25px;
              text-decoration: none;
              text-transform: capitalize;
            }
      
            .btn-primary table td {
              background-color: #e30d0d;
            }
      
            .btn-primary a {
              background-color: #e30d0d;
              border-color: #e30d0d;
              color: #ffffff;
            }
            .last {
              margin-bottom: 0;
            }
      
            .first {
              margin-top: 0;
            }
      
            .align-center {
              text-align: center;
            }
      
            .align-right {
              text-align: right;
            }
      
            .align-left {
              text-align: left;
            }
      
            .clear {
              clear: both;
            }
      
            .mt0 {
              margin-top: 0;
            }
      
            .mb0 {
              margin-bottom: 0;
            }
      
            .preheader {
              color: transparent;
              display: none;
              height: 0;
              max-height: 0;
              max-width: 0;
              opacity: 0;
              overflow: hidden;
              mso-hide: all;
              visibility: hidden;
              width: 0;
            }
      
            hr {
              border: 0;
              border-bottom: 1px solid #f6f6f6;
              margin: 20px 0;
            }
            @media only screen and (max-width: 620px) {
              table.body h1 {
                font-size: 26px !important;
                margin-bottom: 10px !important;
              }
              table.body p,
              table.body ul,
              table.body ol,
              table.body td,
              table.body span,
              table.body a {
                font-size: 15px !important;
              }
              table.body .wrapper,
              table.body .article {
                padding: 20px 25px !important;
              }
              table.body .content {
                padding: 0 !important;
              }
              table.body .container {
                padding: 0 !important;
                width: 100% !important;
              }
              table.body .main {
                border-radius: 0 !important;
              }
              table.body .btn table {
                width: 100% !important;
              }
              table.body .btn a {
                width: 100% !important;
              }
              table.body .img-responsive {
                height: auto !important;
                max-width: 100% !important;
                width: auto !important;
              }
            }
      
            @media all {
              .ExternalClass {
                width: 100%;
              }
              .ExternalClass,
              .ExternalClass p,
              .ExternalClass span,
              .ExternalClass font,
              .ExternalClass td,
              .ExternalClass div {
                line-height: 100%;
              }
              .apple-link a {
                color: inherit !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                text-decoration: none !important;
              }
              #MessageViewBody a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-family: inherit;
                font-weight: inherit;
                line-height: inherit;
              }
              .btn-primary table td:hover {
                background-color: #185cda !important;
              }
              .btn-primary a:hover {
                background-color: #185cda !important;
                border-color: #185cda !important;
              }
            }
          </style>
        </head>
        <body>
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            class="body"
            style="margin:auto"
          >
            <tbody>
              <tr style="height: 30px"></tr>
              <tr>
                <td align="center">
                  <img
                    style="width: 170px; margin: 0 0 10px"
                    src="https://calisdiary.s3.amazonaws.com/app_logo.png"
                  />
                </td>
              </tr>
              <tr>
                <td class="container">
                  <div class="content">
                    <table role="presentation" class="main">
                      <tbody>
                        <tr>
                          <td class="wrapper">
                            <table
                              role="presentation"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td>
                                    <h1>Email Verification</h1>
                                    <p><strong>Dear ${name || "Customer"},</strong></p>
                                    <p>
                                      <strong>${textMsg}</strong>
                                    </p>
                                    <h1
                                      id="otpcode"
                                      style="text-align: center; margin: 30px 0px"
                                    >
                                      <span
                                        style="
                                        padding: 10px 30px;
                                        border-radius: 4px;
                                      "
                                        >${otp}</span
                                      >
                                    </h1>
                                    <p>
                                      If you didn't request this, you can ignore this
                                      email or let us know.
                                    </p>
                                    <p>&nbsp;</p>
                                    <p>
                                      Sincerely,<br />
                                      The Dream Walk Team
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
                <td>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>`



      var transporter = nodemailer.createTransport({
        "host": process.env.AWS_SES_CONFIG_HOST,
        "port": process.env.AWS_SES_CONFIG_PORT,
        "secure": false,
        "auth": {
          "user": process.env.AWS_SES_CONFIG_AUTH_USER,
          "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
        }
      });
      var mailOptions = {
        from: process.env.AWS_SES_CONFIG_AUTH_EMAIL,
        to: to,
        subject: 'Email Verification',
        html: html
      };
      return await transporter.sendMail(mailOptions)
    } catch (error) {
      return error;
    }

  },

  paginationFunction: (result, page, limit) => {
    // console.log("=======>",result)
    let endIndex = page * limit;
    let startIndex = (page - 1) * limit;
    var resultArray = {}

    resultArray.page = page
    resultArray.limit = limit
    resultArray.remainingItems = result.length - endIndex

    if (result.length - endIndex < 0) {
      resultArray.remainingItems = 0
    }
    resultArray.count = result.length
    resultArray.docs = result.slice(startIndex, endIndex)
    resultArray.totalPages = Math.ceil(result.length / limit)
    return resultArray
  },



  uploadFile: async (filePath, fileKey) => {
    const cloudinaryResult = await cloudinary.v2.uploader.upload(filePath);
    return cloudinaryResult.secure_url;
  }


}

async function removeFile(fileName) {
  fs.unlink(fileName, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err}`);
    } else {
      console.log(`File '${fileName}' has been successfully deleted.`);
    }
  });
}