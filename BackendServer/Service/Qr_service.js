import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const generatePrescriptionQR = async (prescriptionId) => {

    const token = jwt.sign(
        {
            prescriptionId
        },
        "VITECARE APPOINTMENT"
    );


    const qrCode = await QRCode.toDataURL(
        JSON.stringify({
            token
        })
    );


    return qrCode;
};


export default generatePrescriptionQR;
