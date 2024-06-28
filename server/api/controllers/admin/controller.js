import joi from 'joi';
import apiError from '../../../helper/apiError';
import response from '../../../../assests/response';
import { userServices } from "../../services/user";
import userType from '../../../enums/userType';
import status from '../../../enums/status';
import responseMessage from '../../../../assests/responseMessage';


const { checkUserExists, createUser, userUpdate, findUser, findUserPagination } = userServices;



export const adminController = {


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
*     responses:
*       200:
*         description: Returns success message
*/



    async getUsersList(req, res, next) {
        const validationSchema = joi.object({
            page: joi.string().required(),
            limit: joi.string().required(),
            search: joi.string().optional(),
            status: joi.string().required()
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



            let query = { status: { $eq: value.status } };

            if (value.status == "ALL") {
                query = {}
            }


            if (value.search) {
                query.name = { $regex: value.search, $options: 'i' }
            }
            let option = {
                page: Number(value.page) || 1,
                limit: Number(value.limit) || 10,
                sort: { createdAt: -1 }
            }

            let result = await findUserPagination(query, option)
            return res.json(new response(result, responseMessage.USERS_FOUND));
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

            let userDetails = await findUser({ _id: value.userId });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.REQUESTED_USER_NOT_FOUND);
            }


            await userUpdate({ _id: value.userId }, { status: status.DELETE });

            return res.json(new response({}, responseMessage.USER_DELETE))
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
*           - BLOCKED
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

            let userDetails = await findUser({ _id: value.userId }, { status: { $ne: status.DELETE } });
            if (!userDetails) {
                throw apiError.notFound(responseMessage.REQUESTED_USER_NOT_FOUND);
            }

            let message;
            switch (value.status) {
                case "BLOCKED":
                    if (userDetails.status === "BLOCKED") {
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

    }






}