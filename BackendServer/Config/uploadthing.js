import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token: "sk_live_9dbd1bf7f0921ddd9cbfdacb254326c2a2552f7c12053e93160186c791594ba7"
});

export const uploadSignature =
  async (file) => {
    try {
      const response =
        await utapi.uploadFiles(
          new File(
            [file.buffer],
            file.originalname,
            {
              type:
                file.mimetype,
            }
          )
        );

      return response.data.url;
    } catch (error) {
      throw new Error(
        "Signature upload failed"
      );
    }
  };

export const uploadPdf =
  async (
    pdfBuffer,
    fileName
  ) => {
    try {
      const response =
        await utapi.uploadFiles(
          new File(
            [pdfBuffer],
            fileName,
            {
              type:
                "application/pdf",
            }
          )
        );

      return response.data.url;
    } catch (error) {
      throw new Error(
        "PDF upload failed"
      );
    }
  };