import { v4 as uuidv4 } from 'uuid';
import Axios from "axios";
import {baseURLApi} from "../../config";

function extractExtensionFrom(filename) {
  if (!filename) {
    return null;
  }

  const regex = /(?:\.([^.]+))?$/;
  return regex.exec(filename)[1];
}

export default class FileUploader {
  static validate(file, schema) {
    if (!schema) {
      return;
    }

    if (schema.image) {
      if (!file.type.startsWith("image")) {
        throw new Error("You must upload an image");
      }
    }

    if (schema.size && file.size > schema.size) {
      throw new Error("File is too big.");
    }

    const extension = extractExtensionFrom(file.name);

    if (schema.formats && !schema.formats.includes(extension)) {
      throw new Error("Invalid format");
    }
  }

  static async upload(path, file, schema) {
    try {
      this.validate(file, schema);
    } catch (error) {
      return Promise.reject(error);
    }

    const extension = extractExtensionFrom(file.name);
    const id = uuidv4();
    const filename = `${id}.${extension}`;
    const privateUrl = `${path}/${filename}`;

    const publicUrl = await this.uploadToServer(file, path, filename);

    return {
      id: id,
      name: file.name,
      sizeInBytes: file.size,
      privateUrl,
      publicUrl,
      new: true,
    };
  }

  static async uploadToServer(file, path, filename) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);
    const uri = `/file/upload/${path}`;
    await Axios.post(uri, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const privateUrl = `${path}/${filename}`;

    console.log("process.env.NODE_ENV in uploadToServer function", process.env.NODE_ENV);
    console.log("baseURLApi in uploadToServer function", baseURLApi);

    return `${baseURLApi}/file/download?privateUrl=${privateUrl}`;
  }
}
