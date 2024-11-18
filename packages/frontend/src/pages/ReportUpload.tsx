import React, { useState, ChangeEvent } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

interface Report {
    name: string;
    date: string;
}

const ReportUpload: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
    
        console.log("API URL:", import.meta.env.VITE_API_URL);
    
        try {
            // Prepare file details for bulk request, including file size
            const fileDetails = files.map(file => ({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size, 
            }));
    
            // Request pre-signed URLs from backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/generate-upload-url`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ files: fileDetails }), // Send files as an array
            });
    
            const data = await response.json();
            const uploadURLs = data.uploadURLs;
    
            // Upload each file using its corresponding pre-signed URL
            await Promise.all(
                files.map((file, index) =>
                    fetch(uploadURLs[index].uploadURL, {
                        method: "PUT",
                        headers: {
                            "Content-Type": file.type,
                        },
                        body: file,
                    })
                )
            );
    
            // Add the files to the reports list
            const newReports = files.map(file => ({
                name: file.name,
                date: new Date().toLocaleDateString(),
            }));
            setReports([...reports, ...newReports]);

            const syncJobResponse = await fetch(`${import.meta.env.VITE_API_URL}/sync`, {
                method: "POST",                
            });

            const syncJobData = await syncJobResponse.json();
            if (syncJobData.statusCode == 200) {
                console.log("Job started successfully!")
            }
    
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };
    

    const filteredReports = reports.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Breadcrumb pageName="Upload Report" />

            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
                <div className="text-center mb-6">
                    <label
                        htmlFor="reportUpload"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded bg-primary py-1 px-2 text-sm font-medium text-white hover:bg-opacity-90 xsm:px-4"
                    >
                        <input
                            type="file"
                            name="reportUpload"
                            id="reportUpload"
                            className="sr-only"
                            onChange={handleUpload}
                            multiple // Allow multiple files
                        />
                        <span>Upload Reports</span>
                    </label>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search reports..."
                        className="w-full rounded border border-stroke p-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <table className="min-w-full border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <thead>
                    <tr>
                        <th className="border-b border-stroke p-2 text-left dark:border-strokedark">Report Name</th>
                        <th className="border-b border-stroke p-2 text-left dark:border-strokedark">Upload Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredReports.length > 0 ? (
                        filteredReports.map((report, index) => (
                            <tr key={index}>
                                <td className="border-b border-stroke p-2 dark:border-strokedark">{report.name}</td>
                                <td className="border-b border-stroke p-2 dark:border-strokedark">{report.date}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="p-2 text-center" colSpan={2}>No reports found</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ReportUpload;
