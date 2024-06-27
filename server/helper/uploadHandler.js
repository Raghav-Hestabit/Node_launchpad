import multer from 'multer';
import path from 'path';
import apiError from '../helper/apiError';


export class UploadHandler{
    constructor(fileSize) {
        this.fileSize = 9999000000 * 90;
        this.max_image_size = 20480000000;
        this.max_video_size = 20480000000;
        this.storage = multer.diskStorage({
            destination(req, file, cb) {
                const root = path.normalize(`${__dirname}/../..`);
                cb(null, `${root}/uploads/`);
            },
            filename(req, file, cb) {
                cb(null, `${Date.now()}_${file.originalname.replace(/\s/g, '')}`);
            },
        });
        this.uploadFile = this.uploadFile.bind(this);
        const root = path.normalize(`${__dirname}/../..`);
    }

    /**
     * @param  {} req
     * @param  {} res
     * @param  {} next
     * @param  {} upload
     */
    handleUploadError(req, res, next, upload) {
        upload(req, res, function (err) {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    throw apiError.badRequest("File size limit exceeds");
                }
                
            }
            return next();
        });
    }

    /**
     * @param  {} req
     * @param  {} res
     * @param  {} next
     */
    uploadFile(req, res, next) {
        const upload = multer({
            storage: this.storage,
            fileFilter: function (req, file, cb) {
                var ext = path.extname(file.originalname).toLowerCase();
              
                cb(null, true)
            },
            limits: {
                fileSize: 9999000000 * 90
            },
        }).any();
        this.handleUploadError(req, res, next, upload);
    }


}

export default new UploadHandler(10);