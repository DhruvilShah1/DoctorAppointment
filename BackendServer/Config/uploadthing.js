import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token:
    process.env.UPLOADTHING_TOKEN
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