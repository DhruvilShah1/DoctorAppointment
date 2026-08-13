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
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>

<style>

    /* Move your existing CSS here */

</style>

</head>

<body>

<div class="container">

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
                ID: ${prescriptionId}
            </div>

        </div>

    </div>

    <div class="content">

        <h2 class="section-title">
            Patient Information
        </h2>

        <div class="info-grid">

            <div class="info-card">
                <div class="label">
                    Doctor Name
                </div>

                <div class="value">
                    Dr. ${doctorName}
                </div>
            </div>

            <div class="info-card">
                <div class="label">
                    Patient Name
                </div>

                <div class="value">
                    ${patientName}
                </div>
            </div>

            <div class="info-card">
                <div class="label">
                    Appointment Date
                </div>

                <div class="value">
                    ${date}
                </div>
            </div>

            <div class="info-card">
                <div class="label">
                    Slot Time
                </div>

                <div class="value">
                    ${slot}
                </div>
            </div>

        </div>


        <h2 class="section-title">
            Instructions
        </h2>

        <div class="instructions-box">
            ${
                instructions || "No instructions provided."
            }
        </div>


        <h2 class="section-title">
            Prescribed Medicines
        </h2>

        <div class="table-container">

            <table>

                <thead>
                    <tr>
                        <th>Medicine</th>
                        <th>Strength</th>
                        <th>Days</th>
                        <th>Morning</th>
                        <th>Afternoon</th>
                        <th>Night</th>
                    </tr>
                </thead>

                <tbody>

                    ${parsedMedicines
                        .map(
                            (m) => `
                            <tr>

                                <td>${m.name || "-"}</td>

                                <td>${m.strength || "-"}</td>

                                <td>${m.days || "-"}</td>

                                <td>
                                    ${
                                        m.timing?.morning
                                            ? `<span class="status-yes">✔</span>`
                                            : `<span class="status-no">✘</span>`
                                    }
                                </td>

                                <td>
                                    ${
                                        m.timing?.afternoon
                                            ? `<span class="status-yes">✔</span>`
                                            : `<span class="status-no">✘</span>`
                                    }
                                </td>

                                <td>
                                    ${
                                        m.timing?.night
                                            ? `<span class="status-yes">✔</span>`
                                            : `<span class="status-no">✘</span>`
                                    }
                                </td>

                            </tr>
                        `
                        )
                        .join("")}

                </tbody>

            </table>

        </div>


        <div class="bottom-grid">

            <div class="signature-card">

                <h3>
                    Doctor Signature
                </h3>

                ${
                    signatureUrl
                        ? `
                            <img
                                src="${signatureUrl}"
                                class="signature-img"
                            />
                        `
                        : `
                            <p style="margin-top:20px;">
                                No Signature
                            </p>
                        `
                }

            </div>


            <div class="qr-card">

                <h3>
                    Scan Prescription
                </h3>

                <img
                    src="${qrCode}"
                    class="qr-img"
                />

            </div>

        </div>

    </div>


    <div class="footer">
        Generated securely by VitalCare Healthcare System
    </div>

</div>

</body>
</html>
`;
};

export default generatePrescriptionHtml;