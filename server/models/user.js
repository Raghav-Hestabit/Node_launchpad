import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import status from '../enums/status';
import approveStatus from '../enums/approveStatus';
import userType, { USER } from '../enums/userType';
import bcrypt from 'bcryptjs';
import gender from "../enums/gender";

var userModel = new Schema({
    name: {
        type: String
    },
    userName: {
        type: String
    },
    dob: {
        type: Date
    },
    mobileNumber: {
        type: String
    },
    address: {
        type: String
    },
    gender: {
        type: String, enum: [gender.MALE, gender.FEMALE, gender.OTHER]
    },
    countryCode: {
        type: String
    },
    userType: {
        type: String,
        enum: [userType.ADMIN, userType.USER],
        default: userType.USER
    },
    approveStatus: {
        type: String,
        enum: [approveStatus.APPROVED, approveStatus.PENDING, approveStatus.REJECTED],
        default: approveStatus.APPROVED
    },

    status: {
        type: String,
        enum: [status.ACTIVE, status.BLOCK, status.DELETE],
        default: status.ACTIVE
    },


    deviceType: {
        type: String,
        default: ''
    },

    deviceToken: [{
        type: String
    }],
    otp: {
        type: String
    },
    profilePic: {
        type: String,
        default:''
    },
    otpTime: {
        type: String
    },
    password: {
        type: String
    },
    isUserVerfied: {
        type: Boolean,
        default:false
    },
    email: {
        type:String
    }


}, { timestamps: true })


userModel.plugin(mongoosePaginate);

module.exports = Mongoose.model('user', userModel);

const User = Mongoose.model("user", userModel);



async function createAdmin() {
    try {
        const existingAdmin = await User.find({ userType: userType.ADMIN }).exec();

        if (existingAdmin.length !== 0) {
            console.log("Default Admin");
        } else {
            const adminDetail = {
                name: "Admin",
                email: "admin@mailinator.com",
                mobileNumber: "1234567899",
                countryCode: "+91",
                password: bcrypt.hashSync("Hestabit@1"),
                userType: userType.ADMIN,
                isUserVerfied: true
            }

            const result = await User.create(adminDetail);
            console.log("Default Admin Created", result);
        }



    } catch (err) {
        console.error("Error", err);
    }
}

createAdmin();