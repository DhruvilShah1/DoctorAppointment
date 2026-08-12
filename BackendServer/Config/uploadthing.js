import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

export const uploadSignature = async (file) => {
  try {
    const utFile = new File([file.buffer], file.originalname, {
      type: file.mimetype,
    });

    const response = await utapi.uploadFiles(utFile);

    if (response.error) {
      throw new Error(response.error.message || "Upload failed");
    }

    return response.data.ufsUrl;
  } catch (error) {
    console.error("Signature upload error:", error);
    throw new Error("Signature upload failed: " + error.message);
  }
};

export const uploadPdf = async (buffer, fileName) => {
  try {
    const utFile = new File([buffer], fileName, {
      type: "application/pdf",
    });

    const response = await utapi.uploadFiles(utFile);

    if (response.error) {
      throw new Error(response.error.message || "Upload failed");
    }

    return response.data.ufsUrl;
  } catch (error) {
    console.error("HTML upload error:", error);
    throw new Error("HTML upload failed: " + error.message);
  }
};
