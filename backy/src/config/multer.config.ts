import multer, { Multer } from 'multer';
import { ApiError } from '../utils/ApiError';
const storage = multer.memoryStorage();


export const upload: Multer = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                ApiError.unsupportedMedia(
                    `Unsupported file type: ${file.mimetype}`
                ) as any,
                false
            );
        }

        cb(null, true);
    },
});
