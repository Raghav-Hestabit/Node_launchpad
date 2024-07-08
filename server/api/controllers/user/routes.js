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
<<<<<<< HEAD

=======
    
>>>>>>> 3d200f78406d67dcd2b414d5e6976bc0205da4e6
    .use(auth.verifyToken)
    .get('/userProfile', userController.userProfile)
    .put('/changePassword',userController.changePassword)
    .post('/logout',userController.logout)
    .delete('/deleteAccount',userController.deleteAccount)
    

    .use(upload.uploadFile)
    .post('/updateStudentProfile',userController.updateStudentProfile)
    .post('/updateTeacherProfile',userController.updateTeacherProfile)
