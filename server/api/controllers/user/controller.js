import Joi from 'joi';
import * as express from 'express'
import apiError from '../../../helper/apiError';
import response from '../../../../assests/response';
import bcrypt from "bcryptjs";
import { userServices } from "../../services/user";
import userType from '../../../enums/userType';
import status from '../../../enums/status';
import commonFunction from '../../../helper/util';
import responseMessage, { USER_NOT_FOUND } from '../../../../assests/responseMessage';
import error from '../../../../assests/error';
import { ObjectId } from 'mongodb';



const { checkUserExists, createUser, userUpdate, findUser, saveEmailOtp, saveMobileOtp, removeEmailOtp, removeMobileOtp, findOtpBuffer, createReferId, createRefer } = userServices;


export const userController = {


    /**
    * @swagger
    * /user/loginUser:
    *   post:
    *     tags:
    *       - USER
    *     description: Login a user
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: loginUserRequest
    *         description: User login request
    *         in: body
    *         required: true
    *         schema:
    *           type: object
    *           properties:
    *             emailOrMobile:
    *               type: string
    *             password:
    *               type: string
    *             deviceType:
    *               type: string
    *             deviceToken:
    *               type: string
    *           required:
    *             - emailOrMobile
    *             - password
    *     responses:
    *       200:
    *         description: Successful login
    *       404:
    *         description: User not found
    *       401:
    *         description: Incorrect login
    */


    async loginUser(req, res, next) {
        const validationSchema = Joi.object({
            emailOrMobile: Joi.string().required(),
            password: Joi.string().required(),
            deviceType: Joi.string().empty('').optional(),
            deviceToken: Joi.string().empty('').optional(),
        });


        try {

            const { error, value } = validationSchema.validate(req.body);
            if (error) {
                return next(error);
            }

            let user = await checkUserExists({ $and: [{ status: { $ne: status.DELETE } }, { $or: [{ email: req.body.emailOrMobile }, { mobileNumber: req.body.emailOrMobile }] }] });

            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }


            if (user.status == status.BLOCK) {
                throw apiError.unauthorized(responseMessage.ACCOUNT_APPROVAL)
            }

            const isPasswordValid = await bcrypt.compare(req.body.password, user.password);


            if (!isPasswordValid) {
                throw apiError.unauthorized(responseMessage.INCORRECT_LOGIN)
            }


            var token = await commonFunction.getToken({
                userId: user._id
            })
            return res.json(new response(user, responseMessage.LOGIN))


        } catch (error) {
            return next(error);
        }
    },

    /**
 * @swagger
 * /user/signUp:
 *   post:
 *     tags:
 *       - USER
 *     description: Sign Up
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *       - in: formData
 *         name: email
 *         type: string
 *         required: true
 *       - in: formData
 *         name: userName
 *         type: string
 *         required: true
 *       - in: formData
 *         name: dob
 *         type: string
 *         required: true
 *       - in: formData
 *         name: mobileNumber
 *         type: string
 *         required: true
 *       - in: formData
 *         name: address
 *         type: string
 *         required: true
 *       - in: formData
 *         name: gender
 *         type: string
 *         required: true
 *       - in: formData
 *         name: countryCode
 *         type: string
 *         required: true
 *       - in: formData
 *         name: password
 *         type: string
 *         required: true
 *       - in: formData
 *         name: deviceToken
 *         type: string
 *         required: false
 *       - in: formData
 *         name: files
 *         type: file
 *         required: false
 *         description: Profile picture
 *     responses:
 *       200:
 *         description: Successful signup
 *       404:
 *         description: User not found
 */

    async userSignUp(req, res, next) {
        const validationSchema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().required(),
            userName: Joi.string().required(),
            dob: Joi.date().required(),
            mobileNumber: Joi.string().required(),
            address: Joi.string().required(),
            gender: Joi.string().required(),
            countryCode: Joi.string().required().max(3),
            password: Joi.string().required(),
            deviceToken: Joi.string().empty('').optional(),
        });
        try {
            const { error, value } = validationSchema.validate(req.body);

            if (error) {
                return next(error);
            }


            let user = await checkUserExists({ $or: [{ mobileNumber: value.mobileNumber }, { email: value.email }] });

            if (user) {
                throw apiError.alreadyExist(responseMessage.USER_ALREADY_EXIST);
            }
            let imageUrlResult;

            if (req.files.length != 0) {
                for (const image of req.files) {

                    let imageResult = await commonFunction.uploadFile(
                        image.path,
                        image.originalname
                    );
                    imageUrlResult = imageResult;
                }
            }

            



            value.password = bcrypt.hashSync(req.body.password, 10);
            let otp = commonFunction.getOTP();
            var otpTime = new Date().getTime() + 300000;
            value.otp = otp;
            value.otpTime = otpTime;
            value.profilePic =  imageUrlResult;




            const result = await createUser(value);
            return res.json(new response(result, responseMessage.USER_CREATED));

        } catch (error) {
            return next(error);
        }
    },


    /**
    * @swagger
    * /user/verifyOTP:
    *   get:
    *     tags:
    *       - USER
    *     description: Verify OTP
    *     produces:
    *       - application/json
    *     parameters:
    *       - in: query
    *         name: userId
    *         type: string
    *         description: _id 
    *         required: true
    *       - in: query
    *         name: otp
    *         type: string
    *         description: otp
    *         required: true
    *     responses:
    *       200:
    *         description: Successful signup
    *       404:
    *         description: User not found
    */

    async verifyOTP(req, res, next) {
        let validateSchema = Joi.object({
            otp: Joi.string().required().min(6).max(6),
            userId: Joi.string().required()
        })
        try {

            const { error, value } = validateSchema.validate(req.query)
            if (error) {
                return next(error);
            }

            let userDetail = await checkUserExists({ _id: value.userId })

            if (!userDetail) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }

            if (new Date().getTime() > userDetail.otpTime) {
                throw apiError.badRequest(responseMessage.OTP_EXPIRED);
            }

            if (userDetail.otp !== value.otp) {
                throw apiError.invalid(responseMessage.INCORRECT_OTP)
            }

            await userUpdate({ _id: userDetail._id }, { isUserVerfied: true })


            return res.json(new response({}, responseMessage.OTP_VERIFY));


        } catch (error) {
            return next(error);
        }

    },



    /**
    * @swagger
    * /user/resendOTP:
    *   get:
    *     tags:
    *       - USER
    *     description: Resend OTP
    *     produces:
    *       - application/json
    *     parameters:
    *       - in: query
    *         name: mobileNumberOREmail
    *         type: string
    *         description: mobileNumberOREmail 
    *         required: true
    *     responses:
    *       200:
    *         description: OTP resend successfully
    *       404:
    *         description: User not found
    */


    async resendOTP(req, res, next) {
        let validateRequest = Joi.object({
            mobileNumberOREmail: Joi.string().required()
        });
        try {
            const { error, value } = validateRequest.validate(req.query);
            if (error) {
                return next(error);
            }

            let userDetail = await checkUserExists({ $or: [{ email: value.mobileNumberOREmail }, { mobileNumber: value.mobileNumberOREmail }] });

            if (!userDetail) {
                throw apiError.notFound(USER_NOT_FOUND);
            }

            let genrateOTP = commonFunction.getOTP();

            await userUpdate({ _id: userDetail._id }, { otp: genrateOTP });

            return res.json(new response({ otp: genrateOTP }, responseMessage.OTP_RESEND));


        } catch (error) {
            return next(error);
        }

    },


    /**
    * @swagger
    * /user/forgotPassword:
    *   get:
    *     tags:
    *       - USER
    *     description: Forgot Password
    *     produces:
    *       - application/json
    *     parameters:
    *       - in: query
    *         name: mobileNumberOREmail
    *         type: string
    *         description: mobileNumberOREmail 
    *         required: true
    *     responses:
    *       200:
    *         description: OTP send successfully
    *       404:
    *         description: User not found
    */


    async forgotPassword(req, res, next) {
        let validateRequest = Joi.object({
            mobileNumberOREmail: Joi.string().required()
        });
        try {
            const { error, value } = validateRequest.validate(req.query);
            if (error) {
                return next(error);
            }

            let userDetail = await checkUserExists({ $or: [{ email: value.mobileNumberOREmail }, { mobileNumber: value.mobileNumberOREmail }] });

            if (!userDetail) {
                throw apiError.notFound(USER_NOT_FOUND);
            }

            let genrateOTP = commonFunction.getOTP();

            await userUpdate({ _id: userDetail._id }, { otp: genrateOTP });

            return res.json(new response({ otp: genrateOTP }, responseMessage.OTP_SEND));
        } catch (error) {
            return next(error);
        }
    },



    /**
   * @swagger
   * /user/resetPassword:
   *   get:
   *     tags:
   *       - USER
   *     description: Reset Password
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: query
   *         name: userId
   *         type: string
   *         description: userId 
   *         required: true
   *       - in: query
   *         name: password
   *         type: string
   *         description: password 
   *         required: true
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       404:
   *         description: User not found
   */



    async resetPassword(req, res, next) {
        let validateRequest = Joi.object({
            userId: Joi.string().required(),
            password: Joi.string().required()
        })

        try {
            const { error, value } = validateRequest.validate(req.query);

            if (error) {
                return next(error);
            }
            let userDetail = await checkUserExists({ _id: value.userId });

            if (!userDetail) {
                throw apiError.notFound(USER_NOT_FOUND)
            }



            await userUpdate({ _id: value.userId }, { password: bcrypt.hashSync(value.password, 10) });

            return res.json(new response({}, responseMessage.PWD_CHANGED));




        } catch (error) {
            return next(error)
        }

    },






}
