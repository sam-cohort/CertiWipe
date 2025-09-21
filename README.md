# CertiWipe - Secure Data Wiping and Verification Tool

CertiWipe is a comprehensive, multi-part application designed to address the e-waste crisis by providing a secure and trustworthy method for wiping data from external drives. It performs a NIST-compliant data erasure and generates a verifiable, digitally signed certificate to build user confidence in IT asset recycling.

---

## Architecture Overview

The system is composed of three main components that work together:

1.  **`CertiWipe-Desktop` (The Wiping Tool)**
    * **Technology:** .NET 8 C# Console Application.
    * **Platform:** Linux.
    * **Functionality:** Performs a low-level, physical disk overwrite on external drives. After a successful wipe, it communicates with the backend server to request and save a cryptographic certificate.

2.  **`CertiWipe-server` (The Certification Authority)**
    * **Technology:** Node.js, Express, TypeScript.
    * **Functionality:** Acts as the central authority. It has two main jobs:
        * An API endpoint (`/create`) that receives wipe data from the C# app, signs it with a secret private key, stores a record in a database, and returns a certificate.
        * An API endpoint (`/verify`) that checks uploaded certificates against its database records to confirm authenticity.

3.  **`certiwipe-client` (The Verification Portal)**
    * **Technology:** React, Vite, TypeScript.
    * **Functionality:** A simple, user-friendly single-page web application. It allows anyone to upload a `.json` certificate file to verify its legitimacy by communicating with the server's `/verify` endpoint.

---

## Prerequisites

Before you begin, ensure the following are installed on your Linux (Ubuntu/Debian-based) system.

### 1. Git
Used for cloning the repository.
```bash
sudo apt-get update
sudo apt-get install git
```
### 2. Node.js (via nvm)
The backend and frontend require Node.js. We recommend using Node Version Manager (nvm) to easily manage versions.
```bash
# Install nvm
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash

# Reload your shell configuration
source ~/.bashrc

# Install and use the latest Long-Term Support (LTS) version of Node.js
nvm install --lts
```
### 3. .NET SDK
The desktop wiping tool is built with C#.
```bash
# Install the .NET 8 SDK
sudo apt-get install -y dotnet-sdk-8.0
```
---

## Setup & Installation
### 1. Clone the Repository
Open your terminal and clone the project.

```bash
git clone https://github.com/sam-cohort/CertiWipe.git
cd certiwipe
```
### 2. Install Backend Dependencies
Navigate to the server directory and install its npm packages.
```bash
cd CertiWipe-server
npm install
```
### 3. Install Frontend Dependencies
Navigate to the client directory and install its npm packages.
```bash
cd ../certiwipe-client
npm install
```
---

## How to Run the Full Application
The complete system requires three separate terminals to be running simultaneously.
### Terminal 1: Start the Backend Server
1. Navigate to the server directory:
```bash
cd /path/to/your/project/certiwipe/CertiWipe-server
```
2. Start the server. It will run on http://localhost:3000.
```bash
npm run dev
```
### Terminal 2: Start the Frontend Client
1. Navigate to the client directory:

```bash
cd /path/to/your/project/certiwipe/certiwipe-client
```
2. Start the Vite development server. It will typically run on http://localhost:5173.
```bash
npm run dev
```
3. You can now open a web browser to the URL provided by Vite to access the verification portal.

### Terminal 3: Run the Desktop Wiping App
1. IMPORTANT: Plug in the external USB drive you wish to wipe.

2. Navigate to the desktop app's project directory:

```bash
cd /path/to/your/project/certiwipe/CertiWipe-Desktop

```

3. Run the C# application with sudo to grant it the necessary low-level hardware access.

```bash
sudo dotnet run
```
4. Follow the on-screen prompts to select the drive and confirm the wipe. A certificate.json file will be saved in the bin/Debug/net8.0/ folder upon completion.

5. You can then take this .json file and upload it to the React website to verify its authenticity.
