"use client";

import { useState } from "react";

export default function CookieViewerPage() {
  const [contents, setContents] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setContents(null);
    setLoading(true);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("cookies") as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) {
      setError("Please select a file first.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("cookies", fileInput.files[0]);

    try {
      const res = await fetch("/api/cookie-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setContents(data.contents);
      } else {
        setError(data.error || "Upload failed.");
      }
    } catch (err) {
      setError("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Cookie Analysis & Viewer
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Upload a exported cookie text file to inspect its contents.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select cookies.txt
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  name="cookies"
                  accept=".txt"
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Upload cookies.txt"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          {contents !== null && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">File Contents:</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono max-h-96">
                {contents}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
