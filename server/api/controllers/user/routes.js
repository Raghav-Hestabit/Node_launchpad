import Express from "express";
import {userController} from "./controller";
import upload from '../../../helper/uploadHandler';
import auth from '../../../helper/auth';


export default Express.Router()

    .post('/loginUser',userController.loginUser)
    .get('/verifyOTP',userController.verifyOTP)
    .get('/resendOTP',userController.resendOTP)
    .get('/forgotPassword',userController.forgotPassword)
    .put('/resetPassword',userController.resetPassword)
    .post('/signUp',upload.uploadFile,userController.userSignUp)


    .use(auth.verifyToken)
    .get('/userProfile', userController.userProfile)
    .put('/changePassword',userController.changePassword)
    .delete('/deleteAccount',userController.deleteAccount)
    .post('/updateProfile',upload.uploadFile,userController.updateProfile)
