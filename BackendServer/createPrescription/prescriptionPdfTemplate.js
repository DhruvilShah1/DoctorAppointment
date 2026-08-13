import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

/**
 * Generate Prescription HTML
 */
const generatePrescriptionHtml = ({
    prescriptionId,
    doctorName,
    patientName,
    date,
    slot,
    instructions,
    parsedMedicines,
    signatureUrl,
    qrCode,
}) => {

    // ----------------------------------------
    // Safety check
    // ----------------------------------------

    const medicines = Array.isArray(parsedMedicines)
        ? parsedMedicines
        : [];

    console.log("========== PDF HTML SERVICE ==========");
    console.log("Prescription ID:", prescriptionId);
    console.log("Doctor:", doctorName);
    console.log("Patient:", patientName);
    console.log("Medicines:", medicines);
    console.log("Is Array:", Array.isArray(medicines));
    console.log("Medicine Count:", medicines.length);
    console.log("=======================================");


    return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8"/>

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
/>

<title>Prescription - ${prescriptionId}</title>

<style>

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {

    font-family: Arial, sans-serif;

    background: #f4f7fb;

    padding: 30px;

    color: #1e293b;

}

.container {

    background: #fff;

    border-radius: 20px;

    overflow: hidden;

    box-shadow:
        0 10px 35px rgba(0, 0, 0, 0.08);

    border: 1px solid #e2e8f0;

}


/* ==============================
   HEADER
============================== */

.header {

    background:
        linear-gradient(
            135deg,
            #0f766e,
            #14b8a6
        );

    color: white;

    padding: 35px;

}

.header-top {

    display: flex;

    justify-content: space-between;

    align-items: center;

}

.hospital-name {

    font-size: 32px;

    font-weight: bold;

}

.subtitle {

    margin-top: 6px;

    opacity: 0.9;

    font-size: 14px;

}

.prescription-badge {

    background:
        rgba(255, 255, 255, 0.2);

    padding: 10px 18px;

    border-radius: 999px;

    font-size: 14px;

}


/* ==============================
   CONTENT
============================== */

.content {

    padding: 35px;

}

.section-title {

    font-size: 20px;

    font-weight: bold;

    color: #0f766e;

    margin-bottom: 15px;

    border-left: 5px solid #14b8a6;

    padding-left: 10px;

}


/* ==============================
   PATIENT INFO
============================== */

.info-grid {

    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 20px;

    margin-bottom: 30px;

}

.info-card {

    background: #f8fafc;

    border: 1px solid #e2e8f0;

    border-radius: 14px;

    padding: 18px;

}

.label {

    color: #64748b;

    font-size: 13px;

    margin-bottom: 5px;

}

.value {

    font-size: 17px;

    font-weight: 600;

    color: #0f172a;

}


/* ==============================
   INSTRUCTIONS
============================== */

.instructions-box {

    background: #ecfeff;

    border-left: 5px solid #14b8a6;

    padding: 20px;

    border-radius: 12px;

    margin-bottom: 30px;

    line-height: 1.8;

    white-space: pre-wrap;

}


/* ==============================
   TABLE
============================== */

.table-container {

    margin-top: 15px;

    overflow: hidden;

    border-radius: 14px;

    border: 1px solid #e2e8f0;

}

table {

    width: 100%;

    border-collapse: collapse;

}

thead {

    background: #0f766e;

    color: white;

}

th {

    padding: 16px;

    text-align: center;

    font-size: 14px;

}

td {

    padding: 15px;

    border-bottom:
        1px solid #e2e8f0;

    text-align: center;

    font-size: 14px;

}

tbody tr:nth-child(even) {

    background: #f8fafc;

}


/* ==============================
   STATUS
============================== */

.status-yes {

    color: green;

    font-weight: bold;

    font-size: 18px;

}

.status-no {

    color: #ef4444;

    font-weight: bold;

    font-size: 18px;

}


/* ==============================
   BOTTOM
============================== */

.bottom-grid {

    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 30px;

    margin-top: 35px;

}

.signature-card,
.qr-card {

    background: #f8fafc;

    border-radius: 18px;

    border: 1px solid #e2e8f0;

    padding: 25px;

    text-align: center;

}

.signature-img {

    max-width: 180px;

    height: 80px;

    object-fit: contain;

    margin-top: 10px;

}

.qr-img {

    width: 130px;

    height: 130px;

    margin-top: 15px;

}


/* ==============================
   FOOTER
============================== */

.footer {

    text-align: center;

    padding: 20px;

    background: #f8fafc;

    color: #64748b;

    font-size: 13px;

    border-top:
        1px solid #e2e8f0;

}


/* ==============================
   PRINT
============================== */

@media print {

    body {

        background: white;

        padding: 0;

    }

    .container {

        box-shadow: none;

        border: none;

    }

}

</style>

</head>


<body>


<div class="container">


    <!-- =========================
         HEADER
    ========================== -->

    <div class="header">

        <div class="header-top">


            <div>

                <div class="hospital-name">

                    VitalCare Clinic

                </div>


                <div class="subtitle">

                    Professional Medical Prescription

                </div>

            </div>


            <div class="prescription-badge">

                ID:
                ${prescriptionId}

            </div>


        </div>

    </div>



    <!-- =========================
         CONTENT
    ========================== -->

    <div class="content">


        <!-- PATIENT INFORMATION -->

        <h2 class="section-title">

            Patient Information

        </h2>


        <div class="info-grid">


            <div class="info-card">

                <div class="label">

                    Doctor Name

                </div>

                <div class="value">

                    Dr. ${doctorName || "-"}

                </div>

            </div>


            <div class="info-card">

                <div class="label">

                    Patient Name

                </div>

                <div class="value">

                    ${patientName || "-"}

                </div>

            </div>


            <div class="info-card">

                <div class="label">

                    Appointment Date

                </div>

                <div class="value">

                    ${date || "-"}

                </div>

            </div>


            <div class="info-card">

                <div class="label">

                    Slot Time

                </div>

                <div class="value">

                    ${slot || "-"}

                </div>

            </div>


        </div>



        <!-- =========================
             INSTRUCTIONS
        ========================== -->

        <h2 class="section-title">

            Instructions

        </h2>


        <div class="instructions-box">

            ${
                instructions ||
                "No instructions provided."
            }

        </div>



        <!-- =========================
             MEDICINES
        ========================== -->

        <h2 class="section-title">

            Prescribed Medicines

        </h2>


        <div class="table-container">


            <table>


                <thead>

                    <tr>

                        <th>
                            Medicine
                        </th>

                        <th>
                            Strength
                        </th>

                        <th>
                            Days
                        </th>

                        <th>
                            Morning
                        </th>

                        <th>
                            Afternoon
                        </th>

                        <th>
                            Night
                        </th>

                    </tr>

                </thead>


                <tbody>


                    ${
                        medicines.length > 0

                            ?

                        medicines
                            .map((medicine) => {

                                const name =
                                    medicine?.name || "-";

                                const strength =
                                    medicine?.strength || "-";

                                const days =
                                    medicine?.days || "-";

                                const morning =
                                    medicine?.timing?.morning;

                                const afternoon =
                                    medicine?.timing?.afternoon;

                                const night =
                                    medicine?.timing?.night;


                                return `

                                    <tr>

                                        <td>
                                            ${name}
                                        </td>

                                        <td>
                                            ${strength}
                                        </td>

                                        <td>
                                            ${days}
                                        </td>


                                        <td>

                                            ${
                                                morning

                                                    ?

                                                `<span
                                                    class="status-yes"
                                                >
                                                    &#10003;
                                                </span>`

                                                    :

                                                `<span
                                                    class="status-no"
                                                >
                                                    &#10007;
                                                </span>`
                                            }

                                        </td>


                                        <td>

                                            ${
                                                afternoon

                                                    ?

                                                `<span
                                                    class="status-yes"
                                                >
                                                    &#10003;
                                                </span>`

                                                    :

                                                `<span
                                                    class="status-no"
                                                >
                                                    &#10007;
                                                </span>`
                                            }

                                        </td>


                                        <td>

                                            ${
                                                night

                                                    ?

                                                `<span
                                                    class="status-yes"
                                                >
                                                    &#10003;
                                                </span>`

                                                    :

                                                `<span
                                                    class="status-no"
                                                >
                                                    &#10007;
                                                </span>`
                                            }

                                        </td>

                                    </tr>

                                `;

                            })
                            .join("")

                            :

                        `

                            <tr>

                                <td
                                    colspan="6"
                                    style="
                                        padding: 25px;
                                        color: #64748b;
                                    "
                                >

                                    No medicines prescribed.

                                </td>

                            </tr>

                        `

                    }


                </tbody>


            </table>


        </div>



        <!-- =========================
             SIGNATURE + QR
        ========================== -->

        <div class="bottom-grid">


            <!-- SIGNATURE -->

            <div class="signature-card">


                <h3>

                    Doctor Signature

                </h3>


                ${
                    signatureUrl

                        ?

                    `

                        <img

                            src="${signatureUrl}"

                            class="signature-img"

                            alt="Doctor Signature"

                        />

                    `

                        :

                    `

                        <p
                            style="
                                margin-top: 20px;
                                color: #64748b;
                            "
                        >

                            No Signature

                        </p>

                    `
                }


            </div>



            <!-- QR -->

            <div class="qr-card">


                <h3>

                    Scan Prescription

                </h3>


                ${
                    qrCode

                        ?

                    `

                        <img

                            src="${qrCode}"

                            class="qr-img"

                            alt="Prescription QR Code"

                        />

                    `

                        :

                    `

                        <p
                            style="
                                margin-top: 20px;
                                color: #64748b;
                            "
                        >

                            QR Code unavailable

                        </p>

                    `
                }


            </div>


        </div>


    </div>



    <!-- =========================
         FOOTER
    ========================== -->

    <div class="footer">

        Generated securely by
        VitalCare Healthcare System

    </div>


</div>


</body>

</html>
`;
};



export default generatePrescriptionHtml;