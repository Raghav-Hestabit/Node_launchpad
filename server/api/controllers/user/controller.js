import Joi from 'joi';
import apiError from '../../../helper/apiError';
import response from '../../../../assests/response';
import bcrypt from "bcryptjs";
import { userServices } from "../../services/user";
import status from '../../../enums/status';
import commonFunction from '../../../helper/util';
import responseMessage from '../../../../assests/responseMessage';
import userType from '../../../enums/userType';
import approveStatus from '../../../enums/approveStatus';



const { checkUserExists, createUser, userUpdate, findUser, findStudent, findTeacher } = userServices;


export const userController = {


    /**
    * @swagger
    * /user/login:
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
    *             email:
    *               type: string
    *             password:
    *               type: string
    *             deviceType:
    *               type: string
    *             deviceToken:
    *               type: string
    *           required:
    *             - email
    *             - password
    *     responses:
    *       200:
    *         description: Successful login
    *       404:
    *         description: User not found
    *       401:
    *         description: Incorrect login
    */


    async login(req, res, next) {
        const validationSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            deviceType: Joi.string().empty('').optional(),
            deviceToken: Joi.string().empty('').optional(),
        });
        try {
            const { error, value } = validationSchema.validate(req.body);
            if (error) {
                return next(error);
            }
            const { email, password } = value;
            const user = await checkUserExists({
                $and: [
                    { status: { $ne: status.DELETE } },
                    { email: email }
                ]
            });
            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            if (user.approveStatus !== approveStatus.APPROVED) {
                throw apiError.unauthorized(responseMessage.APPROVAL_REQURIED)
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw apiError.unauthorized(responseMessage.INCORRECT_LOGIN);
            }


            const token = await commonFunction.getToken({ userId: user._id });
            const userResponse = {
                _id: user._id,
                token: token,
                name: user.name,
                profilePic: user.profilePic,
                isUserVerfied: user.isUserVerfied,
                createdAt: user.createdAt,
                userName: user.userName,
                userType: user.userType,
                approveStatus: user.approveStatus,
                status: user.status,
            };
            return res.json(new response(userResponse, responseMessage.LOGIN));
        } catch (error) {
            return next(error);
        }
    },


    /**
     * @swagger
     * /user/studentSignUp:
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
     *         name: dob
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
     *         enum:
     *           - MALE
     *           - FEMALE
     *           - OTHER
     *       - in: formData
     *         name: password
     *         type: string
     *         required: true
     *       - in: formData
     *         name: currentSchool
     *         type: string
     *         required: true
     *       - in: formData
     *         name: previousSchool
     *         type: string
     *         required: false
     *       - in: formData
     *         name: deviceToken
     *         type: string
     *         required: false
     *       - in: formData
     *         name: profile
     *         type: file
     *         required: true
     *         description: Profile picture
     *       - in: formData
     *         name: mothername
     *         type: string
     *         required: true
     *         description: Mother's name
     *       - in: formData
     *         name: fathername
     *         type: string
     *         required: true
     *         description: Father's name
     *       - in: formData
     *         name: mobileNumber
     *         type: string
     *         required: true
     *         description: Parent's Mobile Number
     *     responses:
     *       200:
     *         description: Successful signup
     *       404:
     *         description: User not found
     */

    async studentSignUp(req, res, next) {
        const validationSchema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            address: Joi.string().required(),
            dob: Joi.date().required(),
            gender: Joi.string().required(),
            currentSchool: Joi.string().required(),
            previousSchool: Joi.string().optional(),
            deviceToken: Joi.string().optional(),
            password: Joi.string().required(),
            mothername: Joi.string().required(),
            fathername: Joi.string().required(),
            mobileNumber: Joi.string().required()
        });
        try {
            const { error, value } = validationSchema.validate(req.body);

            if (error) {
                return next(error);
            }

            let user = await checkUserExists({ email: value.email });

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

                    await commonFunction.removeFile(image.path)
                }
            }





            value.password = bcrypt.hashSync(req.body.password, 10);
            value.profilePic = imageUrlResult;
            value.userType = userType.STUDENT;


            const result = await createUser(value);

            const userResponse = {
                _id: result._id,
                name: result.name,
                profilePic: result.profilePic,
                createdAt: result.createdAt,
                userType: result.userType,
                approveStatus: result.approveStatus,
                status: result.status,
            };


            return res.json(new response(userResponse, responseMessage.USER_CREATED));

        } catch (error) {
            return next(error);
        }
    },

    /**
     * @swagger
     * /user/teacherSignUp:
     *   post:
     *     tags:
     *       - USER
     *     description: Teacher's Sign Up
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
     *         name: dob
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
     *         enum:
     *           - MALE
     *           - FEMALE
     *           - OTHER
     *       - in: formData
     *         name: password
     *         type: string
     *         required: true
     *       - in: formData
     *         name: currentSchool
     *         type: string
     *         required: false
     *       - in: formData
     *         name: previousSchool
     *         type: string
     *         required: false
     *       - in: formData
     *         name: deviceToken
     *         type: string
     *         required: false
     *       - in: formData
     *         name: experience
     *         type: string
     *         required: true
     *       - in: formData
     *         name: expertiseInSubjects
     *         type: array
     *         items:
     *           type: string
     *           enum:
     *             - HINDI
     *             - ENGLISH
     *             - MATH
     *             - SCIENCE
     *             - HISTORY
     *             - ART
     *         collectionFormat: multi
     *         required: true
     *       - in: formData
     *         name: profile
     *         type: file
     *         required: true
     *         description: Profile picture
     *     responses:
     *       200:
     *         description: Successful signup
     *       404:
     *         description: User not found
     */

    async teacherSignUp(req, res, next) {
        const validationSchema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            address: Joi.string().required(),
            dob: Joi.date().required(),
            gender: Joi.string().required(),
            currentSchool: Joi.string().optional(),
            previousSchool: Joi.string().optional(),
            deviceToken: Joi.string().optional(),
            password: Joi.string().required(),
            experience: Joi.string().required(),
            expertiseInSubjects: Joi.alternatives().try(
                Joi.string(),
                Joi.array()
            ),

        });
        try {
            const { error, value } = validationSchema.validate(req.body);

            if (error) {
                return next(error);
            }

            let user = await checkUserExists({ email: value.email });

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

                    await commonFunction.removeFile(image.path)
                }
            }



            value.password = bcrypt.hashSync(req.body.password, 10);
            value.profilePic = imageUrlResult;
            value.userType = userType.TEACHER;


            let result = await createUser(value);

            let userResponse = {
                _id: result._id,
                name: result.name,
                profilePic: result.profilePic,
                createdAt: result.createdAt,
                userType: result.userType,
                approveStatus: result.approveStatus,
                status: result.status,

            };


            return res.json(new response(userResponse, responseMessage.USER_CREATED));

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

            if (userDetail.approveStatus !== approveStatus.APPROVED) {
                throw apiError.unauthorized(responseMessage.APPROVAL_REQURIED)
            }

            let genrateOTP = commonFunction.getOTP();
            var otpTime = new Date().getTime() + 300000;
            await commonFunction.sendMail(value.email, value.name, otp)
            await userUpdate({ _id: user._id }, { otp: genrateOTP, otpTime: otpTime })

            return res.json(new response({}, responseMessage.OTP_RESEND));


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

            if (userDetail.approveStatus !== approveStatus.APPROVED) {
                throw apiError.unauthorized(responseMessage.APPROVAL_REQURIED)
            }

            let genrateOTP = commonFunction.getOTP();
            var otpTime = new Date().getTime() + 300000;
            await commonFunction.sendMail(value.email, value.name, otp)
            await userUpdate({ _id: user._id }, { otp: genrateOTP, otpTime: otpTime })

            return res.json(new response({}, responseMessage.OTP_SEND));
        } catch (error) {
            return next(error);
        }
    },



    /**
   * @swagger
   * /user/resetPassword:
   *   put:
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

            if (userDetail.approveStatus !== approveStatus.APPROVED) {
                throw apiError.unauthorized(responseMessage.APPROVAL_REQURIED)
            }


            await userUpdate({ _id: value.userId }, { password: bcrypt.hashSync(value.password, 10) });

            return res.json(new response({}, responseMessage.PWD_CHANGED));




        } catch (error) {
            return next(error)
        }

    },



    /**
    * @swagger
    * /user/userProfile:
    *   get:
    *     tags:
    *       - USER
    *     description: Profile
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: token
    *         in: header
    *         required: true
    *     responses:
    *       200:
    *         description: Returns success message
    */

    async userProfile(req, res, next) {
        try {

            let userDetail = await findUser({ _id: req.userId });
            return res.json(new response(userDetail, responseMessage.USER_PROFILE_FOUND));

        } catch (error) {
            return next(error);
        }
    },



    /**
   * @swagger
   * /user/changePassword:
   *   put:
   *     tags:
   *       - USER
   *     description: Change Password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: password
   *         description: password
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

    async changePassword(req, res, next) {

        let validateRequest = Joi.object({
            password: Joi.string().required()
        })
        try {
            const { error, value } = validateRequest.validate(req.query)
            if (error) {
                return next(error);
            }


            let userDetail = await findUser({ _id: req.userId });
            if (!userDetail) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            await userUpdate({ _id: req.userId }, { password: bcrypt.hashSync(value.password, 10) });

            return res.json(new response({}, responseMessage.PWD_CHANGED));

        } catch (error) {
            return next(error);
        }
    },



    /**
     * @swagger
     * /user/updateStudentProfile:
     *   post:
     *     tags:
     *       - USER
     *     description: Profile update
     *     consumes:
     *       - multipart/form-data
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: header
     *         name: token
     *         type: string
     *         required: true
     *         description: token
     *       - in: formData
     *         name: name
     *         type: string
     *         required: true
     *         description: name
     *       - in: formData
     *         name: dob
     *         type: string
     *         required: true
     *         description: dob
     *       - in: formData
     *         name: address
     *         type: string
     *         required: true
     *         description: address
     *       - in: formData
     *         name: gender
     *         type: string
     *         required: true
     *         enum:
     *           - MALE
     *           - FEMALE
     *           - OTHER
     *         description: gender
     *       - in: formData
     *         name: currentSchool 
     *         type: string
     *         required: true
     *         description: currentSchool 
     *       - in: formData
     *         name: previousSchool 
     *         type: string
     *         required: false
     *         description: previousSchool 
     *       - in: formData
     *         name: profile 
     *         type: file
     *         required: true
     *         description: profile picture 
     *     responses:
     *       200:
     *         description: Successful signup
     *       404:
     *         description: User not found
     */

    async updateStudentProfile(req, res, next) {
        let validateRequest = Joi.object({
            name: Joi.string().required(),
            dob: Joi.date().required(),
            address: Joi.string().required(),
            gender: Joi.string().required(),
            currentSchool: Joi.string().required(),
            previousSchool: Joi.string().optional(),
        })

        try {
            const { error, value } = validateRequest.validate(req.body);
            if (error) {
                return next(error);
            }

            let userDetails = await checkUserExists({ _id: req.userId });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            let imageUrlResult;

            if (req.files.length != 0) {
                for (const image of req.files) {

                    let imageResult = await commonFunction.uploadFile(
                        image.path,
                        image.originalname
                    );
                    imageUrlResult = imageResult;

                    await commonFunction.removeFile(image.path)
                }
            }


            let updatedProfile = await userUpdate({ _id: userDetails._id }, {
                profilePic: imageUrlResult,
                name: value.name,
                dob: value.dob,
                address: value.address,
                gender: value.gender,
                currentSchool: value.currentSchool,
                previousSchool: value.previousSchool
            });


            return res.json(new response(updatedProfile, responseMessage.UPDATE_USER_PROFILE))

        } catch (error) {
            return next(error);
        }

    },


    /**
     * @swagger
     * /user/updateTeacherProfile:
     *   post:
     *     tags:
     *       - USER
     *     description: Profile update
     *     consumes:
     *       - multipart/form-data
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: header
     *         name: token
     *         type: string
     *         required: true
     *         description: token
     *       - in: formData
     *         name: name
     *         type: string
     *         required: true
     *         description: name
     *       - in: formData
     *         name: dob
     *         type: string
     *         required: true
     *         description: dob
     *       - in: formData
     *         name: address
     *         type: string
     *         required: true
     *         description: address
     *       - in: formData
     *         name: gender
     *         type: string
     *         required: true
     *         enum:
     *           - MALE
     *           - FEMALE
     *           - OTHER
     *         description: gender
     *       - in: formData
     *         name: currentSchool 
     *         type: string
     *         required: false
     *         description: currentSchool 
     *       - in: formData
     *         name: previousSchool 
     *         type: string
     *         required: false
     *         description: previousSchool 
     *       - in: formData
     *         name: experience  
     *         type: string
     *         required: true
     *         description: experience
     *       - in: formData
     *         name: expertiseInSubjects
     *         type: array
     *         items:
     *           type: string
     *           enum:
     *             - HINDI
     *             - ENGLISH
     *             - MATH
     *             - SCIENCE
     *             - HISTORY
     *             - ART
     *         collectionFormat: multi
     *         required: true  
     *       - in: formData
     *         name: profile 
     *         type: file
     *         required: true
     *         description: profile picture 
     *     responses:
     *       200:
     *         description: Successful signup
     *       404:
     *         description: User not found
     */

    async updateTeacherProfile(req, res, next) {
        let validateRequest = Joi.object({
            name: Joi.string().required(),
            dob: Joi.date().required(),
            address: Joi.string().required(),
            gender: Joi.string().required(),
            currentSchool: Joi.string().optional(),
            previousSchool: Joi.string().optional(),
            experience: Joi.string().required(),
            expertiseInSubjects: Joi.alternatives().try(
                Joi.string(),
                Joi.array()
            )
        })

        try {
            const { error, value } = validateRequest.validate(req.body);
            if (error) {
                return next(error);
            }

            let userDetails = await checkUserExists({ _id: req.userId });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            let imageUrlResult;

            if (req.files.length != 0) {
                for (const image of req.files) {

                    let imageResult = await commonFunction.uploadFile(
                        image.path,
                        image.originalname
                    );
                    imageUrlResult = imageResult;

                    await commonFunction.removeFile(image.path)
                }
            }


            let updateProfile = await userUpdate({ _id: userDetails._id }, {
                profilePic: imageUrlResult,
                name: value.name,
                dob: value.dob,
                address: value.address,
                gender: value.gender,
                currentSchool: value.currentSchool,
                previousSchool: value.previousSchool,
                experience: value.experience,
                $addToSet: {
                    expertiseInSubjects: Array.isArray(value.expertiseInSubjects)
                        ? { $each: value.expertiseInSubjects }
                        : value.expertiseInSubjects
                }
            });


            return res.json(new response(updateProfile, responseMessage.UPDATE_USER_PROFILE))

        } catch (error) {
            return next(error);
        }

    },



    /**
       * @swagger
       * /user/logout:
       *   post:
       *     tags:
       *       - USER
       *     description: Logout User
       *     produces:
       *       - application/json
       *     parameters:
       *       - name: token
       *         description: token
       *         in: header
       *         required: true
       *       - name: deviceToken
       *         description: deviceToken
       *         in: query
       *         required: true
       *     responses:
       *       200:
       *         description: Returns success message
       */


    async logout(req, res, next) {
        try {
            await updateUser({ _id: req.userId }, { $pull: { deviceToken: req.body.deviceToken } });

            return res.json(new response({}, responseMessage.USER_LOGOUT));

        } catch (error) {
            return next(error);
        }

    },



    /**
   * @swagger
   * /user/deleteAccount:
   *   delete:
   *     tags:
   *       - USER
   *     description: Delete Account
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

    async deleteAccount(req, res, next) {
        try {
            let userDetail = await findUser({ _id: req.userId });
            if (!userDetail) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            await userUpdate({ _id: req.userId }, { status: status.DELETE });
            return res.json(new response({}, responseMessage.ACCOUNT_DELETE));

        } catch (error) {
            return next(error);
        }

    },






}
