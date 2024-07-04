import joi from 'joi';
import apiError from '../../../helper/apiError';
import response from '../../../../assests/response';
import { userServices } from "../../services/user";
import userType from '../../../enums/userType';
import status from '../../../enums/status';
import responseMessage from '../../../../assests/responseMessage';
import bcrypt from "bcryptjs";
import commonFunction from "../../../helper/util";
import approveStatus, { PENDING } from '../../../enums/approveStatus';

const { checkUserExists, findAllUsers, userUpdate, findUser, findUserPagination } = userServices;



export const adminController = {

    /**
* @swagger
* /admin/loginAdmin:
*   post:
*     tags:
*       - ADMIN
*     description: Login 
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
*               example: admin@mailinator.com
*             password:
*               type: string
*               example: Hestabit@1
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


    async loginAdmin(req, res, next) {
        const validationSchema = joi.object({
            emailOrMobile: joi.string().required(),
            password: joi.string().required()
        });
        try {
            const { error, value } = validationSchema.validate(req.body);
            if (error) {
                return next(error);
            }
            const { emailOrMobile, password } = value;
            const user = await checkUserExists({
                $and: [
                    { status: { $ne: status.DELETE } },
                    { $or: [{ email: emailOrMobile }, { mobileNumber: emailOrMobile }] }
                ]
            });
            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (user.status === status.BLOCK) {
                throw apiError.unauthorized(responseMessage.ACCOUNT_APPROVAL);
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
    * /admin/getUsersList:
    *   get:
    *     tags:
    *       - ADMIN
    *     description: Users List
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: admin token
    *         in: header
    *         required: true
    *       - name: page
    *         description: page
    *         in: query
    *         required: true
    *       - name: limit
    *         description: limit
    *         in: query
    *         required: true
    *       - name: search
    *         description: search
    *         in: query
    *         required: false
    *       - name: status
    *         description: status
    *         in: query
    *         enum:
    *           - ALL
    *           - ACTIVE
    *           - BLOCKED
    *           - DELETE
    *         required: true
    *       - name: userRole
    *         description: userRole
    *         in: query
    *         enum:
    *           - ALL
    *           - STUDENT
    *           - TEACHER
    *           - ADMIN
    *         required: true
    *     responses:
    *       200:
    *         description: Returns success message
    */

    async getUsersList(req, res, next) {
        const validationSchema = joi.object({
            page: joi.string().required(),
            limit: joi.string().required(),
            search: joi.string().optional(),
            status: joi.string().required(),
            userRole: joi.string().required(),
        })

        try {
            const { error, value } = validationSchema.validate(req.query)
            if (error) {
                return next(error);
            }

            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
            }



            let query = {};

            if (value.status && value.status !== "ALL") {
                query.status = value.status;
            }

            if (value.userRole && value.userRole !== "ALL") {
                query.userType = value.userRole;
            }

            if (value.search) {
                query.name = { $regex: value.search, $options: 'i' }
            }
            let option = {
                page: Number(value.page) || 1,
                limit: Number(value.limit) || 10,
                sort: { createdAt: -1 },
                populate: "assignedTeacher assignedStudents"
            }

            let result = await findUserPagination(query, option)
            return res.json(new response(result, responseMessage.USERS_FOUND));
        } catch (error) {
            return next(error);
        }
    },


    /**
    * @swagger
    * /admin/approveUsersRequest:
    *   put:
    *     tags:
    *       - ADMIN
    *     description: Approve user's request
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: admin token
    *         in: header
    *         required: true
    *       - name: userId
    *         description: userId
    *         in: query
    *         required: true
    *     responses:
    *       200:
    *         description: Returns success message
    */

    async approveUsersRequest(req, res, next) {
        let validateRequest = joi.object({
            userId: joi.string().required()
        })
        try {
            const { error, value } = validateRequest.validate(req.query);
            if (error) {
                return next(error);
            }

            let userDetails = await checkUserExists({ _id: value.userId, userType: { $ne: userType.ADMIN }, $and: [{ status: status.ACTIVE }, { approveStatus: { $eq: PENDING } }] });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.REQUESTED_USER_NOT_FOUND);
            }

            await userUpdate({ _id: value.userId }, { approveStatus: approveStatus.APPROVED });

            await commonFunction.sendMail(userDetails.email, userDetails.name, undefined, responseMessage.ACCOUNT_APPROVAL, responseMessage.ACCOUNT_VERIFICATION);

            return res.json(new response({}, responseMessage.ACCOUNT_APPROVED));


        } catch (error) {
            return next(error);
        }

    },


    /**
    * @swagger
    * /admin/deleteUser:
    *   delete:
    *     tags:
    *       - ADMIN
    *     description: Delete user
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: admin token
    *         in: header
    *         required: true
    *       - name: userId
    *         description: userId
    *         in: query
    *         required: true
    *     responses:
    *       200:
    *         description: Returns success message
    */

    async deleteUser(req, res, next) {
        let validateRequest = joi.object({
            userId: joi.string().required()
        });

        try {
            const { error, value } = validateRequest.validate(req.query);
            if (error) {
                return next(error);
            }

            let userDetails = await checkUserExists({ _id: value.userId, userType: { $ne: userType.ADMIN } });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.REQUESTED_USER_NOT_FOUND);
            }

            let allTeachers = userDetails.assignedTeacher;


            await userUpdate(
                { _id: value.userId },
                { $set: { assignedTeacher: [], status: status.DELETE } }
            );


            await userUpdate(
                { _id: { $in: allTeachers } },
                { $pull: { assignedStudents: value.userId } },
                { multi: true }
            );




            return res.json(new response({}, responseMessage.USER_DELETE));
        } catch (error) {
            return next(error);
        }
    },




    /**
    * @swagger
    * /admin/blockUnblockUser:
    *   post:
    *     tags:
    *       - ADMIN
    *     description: Delete user
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: admin token
    *         in: header
    *         required: true
    *       - name: userId
    *         description: userId
    *         in: query
    *         required: true
    *       - name: status
    *         description: status
    *         in: query
    *         enum:
    *           - BLOCK
    *           - UNBLOCK
    *         required: true
    *     responses:
    *       200:
    *         description: Returns success message
    */


    async blockUnblockUser(req, res, next) {
        let validateRequest = joi.object({
            userId: joi.string().required(),
            status: joi.string().required()
        })
        try {
            const { error, value } = validateRequest.validate(req.query);
            if (error) {
                return next(error);
            }

            let adminDetails = await findUser({ _id: req.userId });
            if (!adminDetails) {
                throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
            }

            let userDetails = await checkUserExists({ _id: value.userId, status: { $ne: status.DELETE }, userType: { $ne: userType.ADMIN } });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.REQUESTED_USER_NOT_FOUND);
            }

            let message;
            switch (value.status) {
                case status.BLOCK:
                    if (userDetails.status === status.BLOCK) {
                        message = responseMessage.USERS_ALREADY_BLOCKED;
                    } else {
                        await userUpdate({ _id: value.userId }, { status: status.BLOCK });
                        message = responseMessage.USER_BLOCK;
                    }
                    break;
                case "UNBLOCK":
                    if (userDetails.status === "UNBLOCK") {
                        message = responseMessage.USERS_ALREADY_UNBLOCKED;
                    } else {
                        await userUpdate({ _id: value.userId }, { status: status.ACTIVE });
                        message = responseMessage.USERS_UNBLOCKED;
                    }
                    break;
                default:
                    break;
            }
            return res.json(new response({}, message));
        } catch (error) {
            return next(error);
        }

    },



    /**
        * @swagger
        * /admin/assignTeacher:
        *   post:
        *     tags:
        *       - ADMIN
        *     description: Assign teacher
        *     produces:
        *       - application/json
        *     parameters:
        *       - name: token
        *         description: admin token
        *         in: header
        *         required: true
        *       - name: teacherId
        *         description: teacherId
        *         in: formData
        *         required: true
        *       - name: studentId
        *         description: studentId
        *         in: formData
        *         required: true
        *     responses:
        *       200:
        *         description: Returns success message
        */

    async assignTeacher(req, res, next) {
        let validateRequest = joi.object({
            teacherId: joi.string().required(),
            studentId: joi.string().required(),
        })

        try {

            const { error, value } = validateRequest.validate(req.body);
            if (error) {
                return next(error);
            }

            let teacherDetails = await checkUserExists({ _id: value.teacherId, $and: [{ status: status.ACTIVE }, { approveStatus: approveStatus.APPROVED }] });
            if (!teacherDetails) {
                throw apiError.notFound(responseMessage.TEACHER_NOT_FOUND);
            }


            let userDetails = await checkUserExists({ _id: value.studentId, $and: [{ status: status.ACTIVE }, { approveStatus: approveStatus.APPROVED }, { userType: userType.STUDENT }] });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.STUDENT_NOT_FOUND);
            }



            await Promise.all([
                userUpdate(
                    { _id: value.studentId },
                    { $addToSet: { assignedTeacher: value.teacherId } }
                ),
                userUpdate(
                    { _id: value.teacherId },
                    { $addToSet: { assignedStudents: value.studentId } }
                ),
                commonFunction.sendMail(
                    teacherDetails.email,
                    teacherDetails.name,
                    undefined,
                    responseMessage.STUDENT_ASSIGNED,
                    responseMessage.ASSIGN_STUDENT_HEADING
                )
            ]);
            return res.json(new response({}, responseMessage.TEACHER_ASSIGNED));

        } catch (error) {
            return next(error);
        }

    },






}