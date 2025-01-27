const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const morgan = require("morgan"); 
const KJUR = require("jsrsasign"); // Add this for JWT signing

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 5050;

// Test route
app.get("/", (req, res) => {
  res.send("Zoom MERN API is running!");
});

// Generate Zoom Meeting SDK Signature
// app.post("/generate-signature", (req, res) => {
//   const { meetingNumber, role } = req.body;

//   if (!meetingNumber || typeof role === "undefined") {
//     return res
//       .status(400)
//       .json({ error: "Meeting number and role are required" });
//   }

//   const sdkKey = "vLIhNTnzQN6XwWR6oSdlvA";
//   const sdkSecret = "N8VqW62RY5iK7DKAAsIJKY0RXXMZLLDL";

//   if (!sdkKey || !sdkSecret) {
//     return res
//       .status(500)
//       .json({ error: "SDK Key or Secret is not configured" });
//   }

//   try {
//     // Timestamp in seconds
//     const timestamp = Math.round(new Date().getTime() / 1000) - 30;

//     // Base string for signature
//     const msg = Buffer.from(
//       `${sdkKey}${meetingNumber}${timestamp}${role}`
//     ).toString("base64");

//     // HMAC SHA256 signature
//     const hash = crypto
//       .createHmac("sha256", sdkSecret)
//       .update(msg)
//       .digest("base64");

//     // Final signature
//     const signature = Buffer.from(
//       `${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hash}`
//     ).toString("base64");
//     console.log("Generated Signature:", signature);
//     console.log("Inputs:", { sdkKey, meetingNumber, timestamp, role });
//     res.json({ signature });
//   } catch (error) {
//     console.error("Error generating signature:", error);
//     res.status(500).json({ error: "Error generating signature" });
//   }
// });

// Generate Zoom Meeting SDK Signature
app.post("/generate-signature", (req, res) => {
  const { meetingNumber, role } = req.body;

  if (!meetingNumber || typeof role === "undefined") {
    return res
      .status(400)
      .json({ error: "Meeting number and role are required" });
  }

  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  if (!sdkKey || !sdkSecret) {
    return res
      .status(500)
      .json({ error: "SDK Key or Secret is not configured" });
  }

  try {
    const iat = Math.floor(Date.now() / 1000) - 30; // Subtract 30 seconds for buffer
    const exp = iat + 60 * 60 * 2; // Token expiration (2 hours)

    // JWT Header
    const oHeader = { alg: "HS256", typ: "JWT" };

    // JWT Payload
    const oPayload = {
      sdkKey: sdkKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: sdkKey,
      tokenExp: exp,
    };

    // Create JWT
    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);

    console.log("Generated Signature:", signature);
    res.json({ signature });
  } catch (error) {
    console.error("Error generating signature:", error);
    res.status(500).json({ error: "Error generating signature" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
