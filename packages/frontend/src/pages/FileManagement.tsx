import React, { useState, useEffect, ChangeEvent } from "react";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import JSZip from "jszip";
import { FaUpload, FaTrashAlt, FaDownload} from "react-icons/fa"; // Imported FaExclamationCircle
import { AiOutlineClose } from "react-icons/ai"; // Optional: For closing the disclaimer modal
import { fetchAuthSession   } from '@aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL; // API base URL

interface FileMetadata {
  fileKey: string;
  fileName: string;
  fileURL: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
}

const FileManagement: React.FC = () => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false); // Added state for disclaimer

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken; 

    const response = await fetch(`${API_URL}/retrieve-file-metadata`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format");
      }

      const validFiles = data.data.filter(
        (file: FileMetadata) =>
          file.fileName && file.fileURL && file.fileSize && file.fileType && file.uploadedAt
      );

      setFiles(validFiles || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      setAlertMessage("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Function to handle file uploads - takes an array of File objects as parameter
  const uploadFiles = async (filesToUpload: File[]) => {
    // Prevents unnecessary processing when the files array is empty
    if (filesToUpload.length === 0) return;
  
    setUploading(true);
    try {
      const fileDetails = filesToUpload.map((file) => ({
        fileName: file.webkitRelativePath || file.name,
        fileType: file.type,
        fileSize: file.size,
      }));

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken;

      const response = await fetch(`${API_URL}/generate-upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ files: fileDetails }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Backend responded with an error
        const errorMsg = data.error || "Failed to generate upload URLs.";
        throw new Error(errorMsg);
      }
  
      const uploadURLs = data.uploadURLs;
  
      // Ensure uploadURLs is an array and has the same length as filesToUpload
      if (!Array.isArray(uploadURLs) || uploadURLs.length !== filesToUpload.length) {
        throw new Error("Invalid upload URLs received from the server.");
      }
  
      await Promise.all(
        filesToUpload.map((file, index) =>
          fetch(uploadURLs[index].uploadURL, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          })
        )
      );
  
      fetchFiles(); // Refresh file list after uploading
  
      setAlertMessage("Files uploaded successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMsg = error?.message || "Failed to upload files.";
      setAlertMessage(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const filesToUpload = Array.from(event.target.files || []);
// Pass the files from the folder to the upload function for processing
    await uploadFiles(filesToUpload);
  };

  const handleDelete = async () => {
    if (selectedFiles.length === 0) return;

    setDeleting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken;

      const response = await fetch(`${API_URL}/delete-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ fileKeys: selectedFiles }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchFiles(); // Refresh file list
        setSelectedFiles([]); // Clear selected files
        setAlertMessage("Files deleted successfully!");
      } else {
        console.error("Failed to delete files:", result.message);
        setAlertMessage("Failed to delete files. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting files:", error);
      setAlertMessage("Failed to delete files. Please try again.");
    } finally {
      setDeleting(false);
      setDeletePrompt(false);
    }
  };

  const handleDownload = async () => {
    if (selectedFiles.length === 0) return;
    setDownloading(true);

    const zip = new JSZip();
    try {
      for (const fileKey of selectedFiles) {
        const file = files.find((f) => f.fileKey === fileKey);
        if (file) {
          const response = await fetch(file.fileURL);
          if (!response.ok) {
            throw new Error(`Failed to download file: ${file.fileName}`);
          }
          const fileBlob = await response.blob();
          zip.file(file.fileName, fileBlob); // Add file with correct name to zip
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "InsightAI-files.zip";
      link.click();
    } catch (error) {
      console.error("Error downloading files:", error);
      setAlertMessage("Failed to download files. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const toggleFileSelection = (fileKey: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileKey) ? prev.filter((key) => key !== fileKey) : [...prev, fileKey]
    );
  };

  const handleSelectAll = () => {
    const displayedFileKeys = filteredFiles.map((file) => file.fileKey);
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles((prev) => prev.filter((key) => !displayedFileKeys.includes(key)));
    } else {
      setSelectedFiles((prev) => [...new Set([...prev, ...displayedFileKeys])]);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FOLDER UPLOAD //
  const directoryUploadAttributes = { directory: "true", webkitdirectory: "true", mozdirectory: "true" };

// Handler function specifically for folder upload events
  const handleFolderUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
// Convert FileList object from folder selection to array of Files
    const files = Array.from(event.target.files);
    // Pass the files array to the upload function for processing
    await uploadFiles(files);
  };

  return (
    <>
      <Breadcrumb pageName="Manage Files" />

      {/* Full-Screen Spinners */}
      {(uploading || deleting || downloading) && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
          <div className="flex flex-col items-center">
            <div className="loader border-t-transparent border-4 border-white rounded-full w-8 h-8 animate-spin"></div>
            <p className="text-white mt-2">
              {uploading
                ? "Uploading Files..."
                : deleting
                ? "Deleting Files..."
                : "Processing Files..."}
            </p>
          </div>
        </div>
      )}

      <div className="relative overflow-visible rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        {/* Sticky Header for Buttons and Search */}
        <div className="sticky top-[64px] bg-white z-10 shadow-sm p-4 border-b border-stroke dark:bg-boxdark dark:border-strokedark">
          {/* Upload Section */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <label
              htmlFor="fileUpload"
              className="bg-primary flex cursor-pointer items-center justify-center gap-2 rounded py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90"
            >
              <FaUpload size={16} /> {/* Upload Icon */}
              <input
                type="file"
                id="fileUpload"
                className="sr-only"
                onChange={handleUpload}
                multiple
                disabled={uploading}
                accept=".pdf,.csv" // Restrict file types
              />
              Upload Files
            </label>
            <label
              htmlFor="folderUpload"
              className="bg-primary flex cursor-pointer items-center justify-center gap-2 rounded py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90"
            >
              <FaUpload size={16} /> {/* Upload Icon */}
              <input
                type="file"
                id="folderUpload"
                className="sr-only"
                onChange={handleFolderUpload}
                disabled={uploading}
                multiple
                {...directoryUploadAttributes}
                accept=".pdf,.csv" // Restrict file types
              />
              Upload Folder
            </label>
            {/* Disclaimer Button */}
            <button
              className="flex items-center justify-center self-center w-8 h-8 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
              onClick={() => setShowDisclaimer(true)}
              title="File Upload Guidelines"
            >
              !
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
            <button
              className="flex items-center justify-center gap-2 rounded bg-danger py-1 px-3 text-white disabled:bg-gray-300"
              onClick={() => setDeletePrompt(true)}
              disabled={deleting || selectedFiles.length === 0}
            >
              <FaTrashAlt size={16} /> {/* Delete Icon */}
              Delete Selected
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded bg-secondary py-1 px-3 text-white disabled:bg-gray-300"
              onClick={handleDownload}
              disabled={selectedFiles.length === 0 || downloading}
            >
              <FaDownload size={16} /> {/* Download Icon */}
              Download Selected
            </button>
          </div>

          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Search files..."
              className="w-full rounded border border-stroke p-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Files Table */}
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="loader border-t-transparent border-4 border-gray-300 rounded-full w-8 h-8 animate-spin"></div>
          </div>
        ) : filteredFiles.length > 0 ? (
          <table className="min-w-full border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <thead>
              <tr>
                <th className="border-b border-stroke p-2 text-left dark:border-strokedark">
                  <input
                    type="checkbox"
                    checked={filteredFiles.every((file) => selectedFiles.includes(file.fileKey))}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="border-b border-stroke p-2 text-left dark:border-strokedark">
                  File Name
                </th>
                <th className="border-b border-stroke p-2 text-left dark:border-strokedark">
                  File Type
                </th>
                <th className="border-b border-stroke p-2 text-left dark:border-strokedark">
                  File Size
                </th>
                <th className="border-b border-stroke p-2 text-left dark:border-strokedark">
                  Uploaded At
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.fileKey}>
                  <td className="border-b border-stroke p-2 dark:border-strokedark">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.fileKey)}
                      onChange={() => toggleFileSelection(file.fileKey)}
                    />
                  </td>
                  <td
                    className="border-b border-stroke p-2 dark:border-strokedark cursor-pointer text-blue-600"
                    onClick={() => setPreviewFile(file.fileURL)}
                  >
                    {file.fileName}
                  </td>
                  <td className="border-b border-stroke p-2 dark:border-strokedark">{file.fileType}</td>
                  <td className="border-b border-stroke p-2 dark:border-strokedark">{file.fileSize}</td>
                  <td className="border-b border-stroke p-2 dark:border-strokedark">{file.uploadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-4 text-center text-gray-600">No files found</div>
        )}

        {/* Preview Modal */}
        {previewFile && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-[1002]"
            onClick={() => setPreviewFile(null)} // Close modal when clicking outside
            style={{ zIndex: 1002 }}
          >
            <div
              className="relative w-[95%] max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              {/* Close Button */}
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => setPreviewFile(null)}
              >
                <AiOutlineClose size={24} />
              </button>
              {/* File Preview */}
              <iframe
                src={previewFile}
                className="w-full h-[85vh] rounded-lg"
                title="File Preview"
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg">
              <p>{`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`}</p>
              <div className="flex justify-end mt-4">
                <button
                  className="mr-2 py-1 px-3 bg-gray-300 rounded text-black"
                  onClick={() => setDeletePrompt(false)}
                >
                  Cancel
                </button>
                <button
                  className="py-1 px-3 bg-red-500 rounded text-white"
                  onClick={() => {
                    setDeletePrompt(false);
                    handleDelete();
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {alertMessage && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg text-center">
              <p>{alertMessage}</p>
              <button
                className="mt-4 py-2 px-6 bg-blue-500 text-white rounded"
                onClick={() => setAlertMessage(null)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md relative">
              {/* Close Button */}
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowDisclaimer(false)}
              >
                <AiOutlineClose size={24} />
              </button>
              <h2 className="text-xl font-bold mb-4">File Upload Guidelines</h2>
              <p className="mb-2">
                You can only upload two types of files: <strong>PDF</strong> or <strong>CSV</strong>.
              </p>
              <p className="mb-2">
                The "Upload Folder" option does not work for CSV files; it is only intended for uploading PDF files. 
              </p>
              <p className="mb-2">
                For CSV files, please ensure they have the exact names listed below. Otherwise, the data will not load correctly:
              </p>
              <ul className="list-disc list-inside mb-4">
                <li>Results of Government Schools Reviews.csv</li>
                <li>Results of Private Schools Reviews.csv</li>
                <li>Results of Vocational Reviews.csv</li>
                <li>Results of University Reviews.csv</li>
              </ul>
              <button
                className="mt-2 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowDisclaimer(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FileManagement;
