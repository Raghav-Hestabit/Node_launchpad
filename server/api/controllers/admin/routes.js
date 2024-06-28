import Express from "express";
import { adminController } from "./controller";
import auth from '../../../helper/auth';


export default Express.Router()

    .use(auth.verifyToken)
    .get('/getUsersList', adminController.getUsersList)
    .delete('/deleteUser', adminController.deleteUser)
    .post('/blockUnblockUser', adminController.blockUnblockUser)
