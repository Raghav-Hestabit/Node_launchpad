import cron from 'node-cron';
import { userServices } from "../api/services/user";
import commonFunction from "../helper/util";
import approveStatus from '../enums/approveStatus';
import responseMessage from '../../assests/responseMessage';
import userType from '../enums/userType';

const { findAllUsers, checkUserExists } = userServices;
const cronTime = '* * * * *'; 

export class Scheduler {
    constructor() {
        this.startScheduler(cronTime);
    }

    async startScheduler(cronTime) {
        cron.schedule(cronTime, async () => {
            try {
                let adminDetails =  await checkUserExists({userType:userType.ADMIN});
                const unapprovedUsers = await findAllUnapprovedUsers();
                if (unapprovedUsers.length > 0) {
                   
                    let description = `This is to notify you that ${unapprovedUsers.length === 1 ? 'there is 1 user' : `there are ${unapprovedUsers.length} users`} awaiting approval for their accounts.
                    Please take necessary action to review and approve their accounts promptly.`


                    await commonFunction.sendMail(adminDetails.email, adminDetails.name, undefined, description, responseMessage.ACCOUNT_VERIFICATION_REMINDER);
                    console.log('Email sent to admin with unapproved users list.');
                } else {
                    console.log('No unapproved users found.');
                }
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });
    }
}

async function findAllUnapprovedUsers() {
    try {

        const users = await findAllUsers({ approveStatus: approveStatus.PENDING });
        return users;
    } catch (error) {
        console.error('Error fetching unapproved users:', error);
        throw error;
    }
}
