import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { MulterFile } from 'src/types/multer-file';
@Injectable()
export class CloudinaryService {
  /**
   * Upload un fichier vers Cloudinary.
   * @param file Le fichier à uploader.
   * @param folder Le dossier de destination dans Cloudinary (ex: 'profiles', 'shops', 'products').
   * @returns Un objet contenant l'URL sécurisée et l'ID public de l'image.
   */
  async uploadFile(
    file: MulterFile,
    folder: string,
    options?: Record<string, any>,
  ): Promise<{ secure_url: string; public_id: string }> {
    if (!file) throw new Error('Aucun fichier fourni.');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `alimana/${folder}`, ...options },
        (error, result) => {
          if (error) {
            // console.error('[Cloudinary Error]', error);
            return reject(new Error("Échec de l'upload Cloudinary"));
          }
          if (!result) return reject(new Error('Résultat vide Cloudinary'));

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream); // ✅ Utilisation native
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
