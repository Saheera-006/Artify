import { getExtension } from "../utils/files.js";

export const uploadToCloudinary = async (
  selectedFile,
  registerNumber,
  round,
) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing.");
  }

  const extension = getExtension(selectedFile.name);
  const isPdf = extension === "pdf";

  const renamedFile = new File(
    [selectedFile],
    `${registerNumber}.${extension}`,
    {
      type: selectedFile.type || (isPdf ? "application/pdf" : "image/jpeg"),
    },
  );

  const formData = new FormData();
  formData.append("file", renamedFile);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `artify/submissions/${round.id}`);

  /*
   * PDFs are intentionally uploaded as Cloudinary image assets.
   * Cloudinary supports PDF transformations (including page -> JPG),
   * which lets the admin preview PDFs as images even when direct PDF
   * delivery is disabled on a free Cloudinary account.
   */
  // Always keep the preview asset as an IMAGE resource.
  // Cloudinary can rasterize PDF pages to JPG from an image-resource PDF.
  const previewResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const previewResult = await previewResponse.json().catch(() => null);

  if (!previewResponse.ok) {
    throw new Error(
      previewResult?.error?.message || "Cloudinary preview upload failed.",
    );
  }

  // PDFs are also uploaded once as RAW. This gives us a separate original
  // download URL that is not dependent on Cloudinary PDF delivery from the
  // image resource. fl_attachment can be used on raw assets as well.
  let downloadResult = previewResult;

  if (isPdf) {
    const rawFormData = new FormData();
    rawFormData.append("file", renamedFile);
    rawFormData.append("upload_preset", uploadPreset);
    rawFormData.append("folder", `artify/submissions/${round.id}`);

    const rawResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: "POST",
        body: rawFormData,
      },
    );

    downloadResult = await rawResponse.json().catch(() => null);

    if (!rawResponse.ok) {
      throw new Error(
        downloadResult?.error?.message ||
          "Cloudinary original PDF upload failed.",
      );
    }
  }

  return {
    ...previewResult,
    previewUrl: previewResult.secure_url,
    downloadUrl: downloadResult.secure_url,
    downloadPublicId: downloadResult.public_id || previewResult.public_id || "",
    downloadResourceType: downloadResult.resource_type || "image",
  };
};
