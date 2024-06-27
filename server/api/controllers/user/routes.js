import Express from "express";
import {userController} from "./controller";
import upload from '../../../helper/uploadHandler';


export default Express.Router()



    .post('/loginUser',userController.loginUser)
    .get('/verifyOTP',userController.verifyOTP)
    .get('/resendOTP',userController.resendOTP)
    .get('/forgotPassword',userController.forgotPassword)
    .get('/resetPassword',userController.resetPassword)
    
    .use(upload.uploadFile)
    .post('/signUp',userController.userSignUp)