declare module "exif" {
  export interface Exif {
    image: any;
    thumbnail: any;
    exif: {
      DateTimeOriginal: string;
      CreateDate: string;
    };
  }
  export class ExifImage {
    constructor(opt: {
      image: string;
    }, cb: (
      error: Error,
      exifData: Exif,
    ) => void);
  }
}