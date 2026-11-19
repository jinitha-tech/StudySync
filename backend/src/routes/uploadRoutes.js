const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const cloudinary = require("../config/cloudinary");
const upload = require("../middlewares/upload");

const router = express.Router();
const localUploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a PDF, DOC, or DOCX file.",
      });
    }

    // Try Cloudinary upload if configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "studysync/resources",
              resource_type: "raw",
              public_id: `${Date.now()}-${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          stream.end(req.file.buffer);
        });

        return res.status(201).json({
          message: "Document uploaded successfully",
          url: result.secure_url,
          publicId: result.public_id,
          fileName: req.file.originalname,
        });
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr.message);
      }
    }

    // Fallback: Save file to local uploads directory
    const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(localUploadsDir, safeName);
    fs.writeFileSync(filePath, req.file.buffer);

    return res.status(201).json({
      message: "Document uploaded successfully (local storage)",
      url: `/uploads/${safeName}`,
      publicId: safeName,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload failed:", error.message);
    return res.status(500).json({
      message: "Document upload failed",
    });
  }
});

module.exports = router;
