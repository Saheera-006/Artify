package com.artify.service;

import com.artify.exception.ApiException;
import java.io.*;
import java.net.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ImageService {
  private static final int MAX_BYTES = 15 * 1024 * 1024;
  private final String cloud;

  public ImageService(@Value("${artify.cloudinary-cloud-name}") String cloud) {
    this.cloud = cloud;
  }

  public record ImageData(String data, String mimeType) {}

  public boolean isPdf(String url) {
    String path = url.split("[?#]", 2)[0].toLowerCase(Locale.ROOT);
    return path.endsWith(".pdf") || path.contains(".pdf/");
  }

  public String evaluationUrl(String url) {
    if (cloud.isBlank()) throw new ApiException(503, "Cloudinary cloud name is not configured.");
    try {
      URI uri = URI.create(url);
      if (!"https".equals(uri.getScheme())
          || !"res.cloudinary.com".equals(uri.getHost())
          || uri.getUserInfo() != null
          || uri.getPort() != -1
          || !uri.getRawPath().startsWith("/" + cloud + "/image/upload/")
          || uri.getRawPath().contains("..")
          || uri.getRawPath().contains("%")) {
        throw new IllegalArgumentException();
      }
      return isPdf(url) ? url.replace("/upload/", "/upload/f_jpg/") : url;
    } catch (IllegalArgumentException e) {
      throw new ApiException(
          400, "Use an HTTPS image upload URL from the configured Cloudinary cloud.");
    }
  }

  public ImageData download(String url) {
    HttpURLConnection connection = null;
    try {
      connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
      connection.setInstanceFollowRedirects(false);
      connection.setConnectTimeout(15000);
      connection.setReadTimeout(60000);
      if (connection.getResponseCode() != 200)
        throw new ApiException(502, "Unable to download submission image.");
      String mime =
          Optional.ofNullable(connection.getContentType())
              .orElse("")
              .split(";", 2)[0]
              .toLowerCase(Locale.ROOT);
      if (!Set.of("image/jpeg", "image/png", "image/webp", "image/heic", "image/heif")
          .contains(mime)) throw new ApiException(400, "Evaluation file is not a supported image.");
      if (connection.getContentLengthLong() > MAX_BYTES)
        throw new ApiException(413, "Submission image exceeds 15 MB.");
      try (InputStream stream = connection.getInputStream()) {
        byte[] bytes = stream.readNBytes(MAX_BYTES + 1);
        if (bytes.length > MAX_BYTES)
          throw new ApiException(413, "Submission image exceeds 15 MB.");
        return new ImageData(Base64.getEncoder().encodeToString(bytes), mime);
      }
    } catch (IOException e) {
      throw new ApiException(502, "Unable to download submission image.", true);
    } finally {
      if (connection != null) connection.disconnect();
    }
  }
}
