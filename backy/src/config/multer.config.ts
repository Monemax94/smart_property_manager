import multer, { Multer } from 'multer';
import { ApiError } from '../utils/ApiError';
const storage = multer.memoryStorage();


export const upload: Multer = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos config
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf',
            'video/mp4', 'video/quicktime', 'video/webm'
        ];

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
