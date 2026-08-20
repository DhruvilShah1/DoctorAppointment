const EmailPrescriptionTemplate = (
  patientName,
  doctorName,
  date,
  slot,
  instructions
) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Your Prescription</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="padding:40px 15px;"
  >

    <tr>
      <td align="center">

        <!-- Main Container -->
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="
            max-width:600px;
            width:100%;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(0,0,0,0.08);
          "
        >

          <!-- Header -->
          <tr>
            <td
              style="
                background:#0f766e;
                padding:28px 30px;
                color:#ffffff;
              "
            >

              <table width="100%">
                <tr>

                  <td>
                    <div
                      style="
                        font-size:24px;
                        font-weight:bold;
                      "
                    >
                      MediCare
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:13px;
                        opacity:0.9;
                      "
                    >
                      Digital Healthcare
                    </div>
                  </td>

                  <td
                    align="right"
                    style="
                      font-size:32px;
                    "
                  >
                    +
                  </td>

                </tr>
              </table>

            </td>
          </tr>


          <!-- Greeting -->
          <tr>
            <td style="padding:32px 30px 10px 30px;">

              <div
                style="
                  font-size:14px;
                  color:#6b7280;
                  margin-bottom:8px;
                "
              >
                PRESCRIPTION READY
              </div>

              <h1
                style="
                  margin:0;
                  font-size:25px;
                  color:#111827;
                "
              >
                Hello ${patientName},
              </h1>

              <p
                style="
                  font-size:15px;
                  line-height:1.6;
                  color:#6b7280;
                  margin-top:12px;
                "
              >
                Your doctor has completed your prescription.
                Please find the prescription details below.
              </p>

            </td>
          </tr>


          <!-- Doctor Information -->
          <tr>
            <td style="padding:15px 30px;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background:#f0fdfa;
                  border:1px solid #ccfbf1;
                  border-radius:12px;
                "
              >

                <tr>

                  <td style="padding:20px;">

                    <div
                      style="
                        font-size:12px;
                        color:#0f766e;
                        font-weight:bold;
                        text-transform:uppercase;
                        margin-bottom:7px;
                      "
                    >
                      Attending Doctor
                    </div>

                    <div
                      style="
                        font-size:18px;
                        font-weight:bold;
                        color:#134e4a;
                      "
                    >
                      Dr. ${doctorName}
                    </div>

                  </td>

                </tr>

              </table>

            </td>
          </tr>


          <!-- Appointment Details -->
          <tr>
            <td style="padding:10px 30px 20px 30px;">

              <div
                style="
                  font-size:16px;
                  font-weight:bold;
                  margin-bottom:15px;
                  color:#111827;
                "
              >
                Consultation Details
              </div>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
              >

                <tr>

                  <td
                    width="50%"
                    style="
                      padding:14px;
                      background:#f9fafb;
                      border-radius:10px;
                    "
                  >

                    <div
                      style="
                        font-size:12px;
                        color:#6b7280;
                        margin-bottom:5px;
                      "
                    >
                      DATE
                    </div>

                    <div
                      style="
                        font-size:15px;
                        font-weight:bold;
                        color:#111827;
                      "
                    >
                      ${date}
                    </div>

                  </td>

                  <td width="12"></td>

                  <td
                    width="50%"
                    style="
                      padding:14px;
                      background:#f9fafb;
                      border-radius:10px;
                    "
                  >

                    <div
                      style="
                        font-size:12px;
                        color:#6b7280;
                        margin-bottom:5px;
                      "
                    >
                      APPOINTMENT TIME
                    </div>

                    <div
                      style="
                        font-size:15px;
                        font-weight:bold;
                        color:#111827;
                      "
                    >
                      ${slot}
                    </div>

                  </td>

                </tr>

              </table>

            </td>
          </tr>


          <!-- Doctor Instructions -->
          <tr>
            <td style="padding:5px 30px 25px 30px;">

              <div
                style="
                  font-size:16px;
                  font-weight:bold;
                  margin-bottom:12px;
                  color:#111827;
                "
              >
                Doctor's Instructions
              </div>

              <div
                style="
                  background:#fffbeb;
                  border-left:4px solid #f59e0b;
                  padding:18px;
                  border-radius:8px;
                  font-size:14px;
                  line-height:1.7;
                  color:#4b5563;
                "
              >
                ${instructions || "Please follow the instructions provided by your doctor."}
              </div>

            </td>
          </tr>


          <!-- Prescription Attachment -->
          <tr>
            <td style="padding:5px 30px 30px 30px;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background:#f8fafc;
                  border:1px solid #e5e7eb;
                  border-radius:12px;
                "
              >

                <tr>

                  <td
                    style="
                      padding:20px;
                    "
                  >

                    <div
                      style="
                        font-size:15px;
                        font-weight:bold;
                        color:#111827;
                      "
                    >
                      📄 Prescription Attached
                    </div>

                    <div
                      style="
                        font-size:13px;
                        color:#6b7280;
                        margin-top:6px;
                        line-height:1.5;
                      "
                    >
                      Your prescription PDF is attached to this
                      email for your records.
                    </div>

                  </td>

                </tr>

              </table>

            </td>
          </tr>


          <!-- Important Notice -->
          <tr>
            <td style="padding:0 30px 30px 30px;">

              <div
                style="
                  font-size:12px;
                  line-height:1.6;
                  color:#6b7280;
                  background:#f9fafb;
                  padding:15px;
                  border-radius:8px;
                "
              >

                <strong style="color:#374151;">
                  Important:
                </strong>

                Please take medicines only according to your
                doctor's prescription. Do not change the dosage
                or stop medication without consulting your doctor.

              </div>

            </td>
          </tr>


          <!-- Footer -->
          <tr>
            <td
              style="
                background:#f8fafc;
                padding:25px 30px;
                border-top:1px solid #e5e7eb;
                text-align:center;
              "
            >

              <div
                style="
                  font-size:14px;
                  font-weight:bold;
                  color:#374151;
                "
              >
                Thank you for choosing MediCare
              </div>

              <div
                style="
                  margin-top:7px;
                  font-size:12px;
                  color:#9ca3af;
                  line-height:1.5;
                "
              >
                This is an automated email. Please do not
                reply directly to this message.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>

</html>
  `;
};

export default EmailPrescriptionTemplate;