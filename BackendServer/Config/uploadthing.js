import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token:
    process.env
      .UPLOADTHING_TOKEN,
});

// Upload Signature
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

      if (
        !response?.data?.url
      ) {
        throw new Error(
          "Signature upload failed"
        );
      }

      return response.data.url;

    } catch (error) {
      console.log(
        "Signature Upload Error:",
        error
      );

      throw new Error(
        "Signature upload failed"
      );
    }
  };

// Upload PDF
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

      if (
        !response?.data?.url
      ) {
        throw new Error(
          "PDF upload failed"
        );
      }

      return response.data.url;

    } catch (error) {
      console.log(
        "PDF Upload Error:",
        error
      );

      throw new Error(
        "PDF upload failed"
      );
    }
  };