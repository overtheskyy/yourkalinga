import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    // Cloudinary integration
    const cloudinary = await this.getCloudinary();
    if (!cloudinary) {
      // Return placeholder if Cloudinary not configured
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'yourkalinga/avatars',
          public_id: `user-${userId}`,
          overwrite: true,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  private async getCloudinary() {
    if (!process.env.CLOUDINARY_CLOUD_NAME) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { v2: cloudinary } = require('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      return cloudinary;
    } catch {
      return null;
    }
  }
}
