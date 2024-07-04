import cron from 'node-cron';
import { userServices } from "../api/services/user";
import commonFunction from "../helper/util";
import approveStatus from '../enums/approveStatus';
import responseMessage from '../../assests/responseMessage';
import userType from '../enums/userType';

const { findAllUsers, checkUserExists } = userServices;
const cronTime = '00 17 * * *'; 

export class Scheduler {
    constructor() {
        this.startScheduler();
    }

    async startScheduler() {
        cron.schedule(cronTime, async () => {
            try {
                let adminDetails =  await checkUserExists({userType:userType.ADMIN});
                const unapprovedUsers =  await findAllUsers({ approveStatus: approveStatus.PENDING });
                if (unapprovedUsers.length > 0) {
                   
                    let description = `This is to notify you that ${unapprovedUsers.length === 1 ? 'there is 1 user' : `there are ${unapprovedUsers.length} users`} awaiting approval for their accounts.
                    Please take necessary action to review and approve their accounts promptly.`


                    await commonFunction.sendMail(adminDetails.email, adminDetails.name, undefined, description, responseMessage.ACCOUNT_VERIFICATION_REMINDER);
                    console.log(responseMessage.UNAPPROVED_USER_EMAIL);
                } else {
                    console.log(responseMessage.NO_UNAPPROVED_USER_EMAIL);
                }
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });
    }
}

