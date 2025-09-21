import { useState } from 'react';
import './App.css';

function App() {
  const [verificationResult, setVerificationResult] = useState({ message: '', isValid: null as boolean | null });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const certificate = JSON.parse(text);
        
        // This is the data we'll send to the backend
        const verificationPayload = {
          wipeId: certificate.wipeId,
          certificateData: certificate.certificateData,
          signature: certificate.signature,
          publicKey: certificate.publicKey
        };
        
        verifyCertificate(verificationPayload);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to read or parse file.";
        setVerificationResult({ message: `❌ Error: ${errorMessage}`, isValid: false });
      }
    };
    reader.readAsText(file);
  };

  const verifyCertificate = async (payload: any) => {
    setIsLoading(true);
    setVerificationResult({ message: 'Verifying...', isValid: null });
    try {
      const response = await fetch('http://localhost:3000/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'An unknown server error occurred.');
      setVerificationResult({ message: result.message, isValid: result.success });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setVerificationResult({ message: `❌ Error: ${errorMessage}`, isValid: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header Section */}
      <div className="header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4A9EFF"/>
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="certi">Certi</span>
            <span className="wipe">Wipe</span>
          </div>
        </div>
        <div className="subtitle">
          <span className="star">✦</span>
          Certificate Verification
          <span className="star">✦</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <p className="instruction">
          Upload your <span className="json-badge">.json</span> certificate file to verify its authenticity and view comprehensive wipe details with military-grade security validation.
        </p>

        {/* Feature Highlights */}
        <div className="features">
          <div className="feature">
            <div className="feature-icon verified">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L10.5 5.5L16 6L12 10L13 16L8 13L3 16L4 10L0 6L5.5 5.5L8 0Z" fill="#4CAF50"/>
                <path d="M6 8L7.5 9.5L10 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>Cryptographically Verified</span>
          </div>
          <div className="feature">
            <div className="feature-icon standard">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L10.5 5.5L16 6L12 10L13 16L8 13L3 16L4 10L0 6L5.5 5.5L8 0Z" fill="none" stroke="#4A9EFF" strokeWidth="1.5"/>
              </svg>
            </div>
            <span>Industry Standard</span>
          </div>
          <div className="feature">
            <div className="feature-icon tamper">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L10.5 5.5L16 6L12 10L13 16L8 13L3 16L4 10L0 6L5.5 5.5L8 0Z" fill="none" stroke="#4CAF50" strokeWidth="1.5"/>
              </svg>
            </div>
            <span>Tamper Proof</span>
          </div>
        </div>

        {/* Upload Area */}
        <div className="upload-container">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L24 32M24 4L16 12M24 4L32 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 36L8 40C8 42.2091 9.79086 44 12 44L36 44C38.2091 44 40 42.2091 40 40L40 36" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="upload-title">Click to Upload Certificate File</h2>
          <p className="upload-description">
            Upload your <span className="json-badge">.json</span> certificate file generated by CertiWipe
          </p>
          <p className="upload-instructions">
            Drag and drop your file here, or click to browse • Maximum file size: 10MB
          </p>
          
          <label htmlFor="certificateFile" className={`upload-button ${isLoading ? 'disabled' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4H16V16H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Select Certificate File
          </label>
          <input
            type="file"
            id="certificateFile"
            accept=".json"
            onChange={handleFileChange}
            disabled={isLoading}
            style={{ display: 'none' }}
          />
        </div>

        {/* Information Section */}
        <div className="info-section">
          <h3>What is a CertiWipe Certificate?</h3>
          <p>
            CertiWipe certificates are cryptographically signed documents that provide proof of secure data wiping. 
            Each certificate contains device information, wipe method details, timestamps, and verification hashes 
            to ensure the authenticity and integrity of the data destruction process.
          </p>
        </div>

        {/* Verification Result */}
        {verificationResult.message && (
          <div 
            className={`result ${verificationResult.isValid === true ? 'valid' : verificationResult.isValid === false ? 'invalid' : ''}`}
          >
            {verificationResult.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;