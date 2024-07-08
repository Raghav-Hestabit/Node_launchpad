import Express from "express";
import {userController} from "./controller";
import upload from '../../../helper/uploadHandler';
import auth from '../../../helper/auth';


export default Express.Router()

    .post('/login',userController.login)
    .get('/verifyOTP',userController.verifyOTP)
    .get('/resendOTP',userController.resendOTP)
    .get('/forgotPassword',userController.forgotPassword)
    .put('/resetPassword',userController.resetPassword)

    .post('/studentSignUp',upload.uploadFile,userController.studentSignUp)
    .post('/teacherSignUp',upload.uploadFile,userController.teacherSignUp)

    .use(auth.verifyToken)
    .get('/userProfile', userController.userProfile)
    .put('/changePassword',userController.changePassword)
    .post('/logout',userController.logout)
    .delete('/deleteAccount',userController.deleteAccount)
    

    .use(upload.uploadFile)
    .post('/updateStudentProfile',userController.updateStudentProfile)
    .post('/updateTeacherProfile',userController.updateTeacherProfile)
