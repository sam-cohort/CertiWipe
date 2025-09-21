import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// --- MOCK DATABASE ---
// In a real app, this would be a real database like PostgreSQL or MongoDB.
const certificateDatabase: any = {};

// --- GENERATE AND STORE THE SERVER'S KEY PAIR ---
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// =======================================================
//  1. ENDPOINT FOR C# APP TO CREATE & STORE A CERTIFICATE
// =======================================================
app.post('/create', (req, res) => {
    try {
        const { wipeData } = req.body; // e.g., { driveSerial: "XYZ", wipeMethod: "NIST..." }
        if (!wipeData) {
            return res.status(400).json({ error: 'wipeData is required.' });
        }

        const wipeId = crypto.randomUUID();
        const certificateText = `Wipe ID: ${wipeId}\nData: ${JSON.stringify(wipeData)}`;

        const signer = crypto.createSign('SHA256');
        signer.update(certificateText);
        const signature = signer.sign(privateKey, 'base64');

        // Store the essential info in our "database"
        certificateDatabase[wipeId] = {
            signature: signature,
            publicKey: publicKey,
            data: certificateText,
            timestamp: new Date().toISOString()
        };

        console.log(`Certificate ${wipeId} created and stored.`);

        // Send the complete certificate file contents back to the C# app
        res.json({
            wipeId: wipeId,
            certificateData: certificateText,
            signature: signature,
            publicKey: publicKey
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to create certificate.' });
    }
});

// =======================================================
//  2. ENDPOINT FOR REACT APP TO VERIFY A CERTIFICATE BY ID
// =======================================================
app.post('/verify', (req, res) => {
    try {
        const { wipeId, certificateData, signature, publicKey } = req.body;
        if (!wipeId || !certificateData || !signature || !publicKey) {
            return res.status(400).json({ error: 'Full certificate object is required for verification.' });
        }

        // Find the original record in the database
        const dbRecord = certificateDatabase[wipeId];

        if (!dbRecord) {
            return res.json({ success: false, message: '❌ Verification Failed: Wipe ID not found in database.' });
        }

        // Compare the submitted signature with the one from our database
        if (dbRecord.signature !== signature) {
            return res.json({ success: false, message: '❌ Verification Failed: Signature does not match database record.' });
        }

        // Finally, perform the cryptographic verification
        const verifier = crypto.createVerify('SHA256');
        verifier.update(certificateData);
        const isValid = verifier.verify(publicKey, signature, 'base64');

        if (isValid) {
            res.json({ success: true, message: '✅ Verification Successful: Certificate is authentic and found in database.' });
        } else {
            res.json({ success: false, message: '❌ Verification Failed: Cryptographic check failed.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Verification failed due to an internal error.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`CertiWipe server running on http://localhost:${PORT}`);
});