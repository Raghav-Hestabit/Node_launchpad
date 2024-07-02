import userModel from '../../models/user';



export const userServices = {

    async checkUserExists(query) {
        try {
            const user = await userModel.findOne(query);
            return user;
        } catch (error) {
            throw error;
        }
    },

    createUser: async (insertObj) => {
        return await userModel.create(insertObj);
    },

    userUpdate: async (query, updateObj) => {
        return await userModel.findOneAndUpdate(query, updateObj, { new: true });
    },
    deleteUser: async (query, updateObj) => {
        return await userModel.findOneAndDelete(query);
    },

    findUser: async (query) => {
        return await userModel.findById(query).select(
            "-otp -password -otpTime -deviceToken");
    },

    findStudent: async (query) => {
        return await userModel.findById(query).select(
            "-otp -password -otpTime -deviceToken -assignedStudents -experience -expertiseInSubjects");
    },

    findTeacher: async (query) => {
        return await userModel.findById(query).select(
            "-otp -password -otpTime -deviceToken -mothername -fathername -mobileNumber -assignedTeacher");
    },


    findUserPagination: async (query, option) => {
        return await userModel.paginate(query, option)
    },


}
