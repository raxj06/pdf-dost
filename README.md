# PDF Dost - Header & Footer Editor

A modern, full-stack web application for adding customizable headers and footers to PDF documents. Built with React.js and Node.js.

## 🚀 Features

- **📁 File Upload**: Drag & drop PDF file upload
- **📄 Header & Footer**: Add customizable headers and footers
- **🔢 Page Numbering**: Multiple page numbering formats
- **📍 Positioning**: Left, center, and right positioning options
- **⚙️ Configuration**: Start page number and white overlay options
- **💾 Download**: Download processed PDF instantly

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Vanilla CSS with modern styling
- Responsive design
- File drag & drop functionality

### Backend
- Node.js with Express
- PDF-lib for PDF manipulation
- Multer for file uploads
- CORS for cross-origin requests

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-dost
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or run them separately:
   # Backend (from root)
   npm run server
   
   # Frontend (from client directory)
   npm run client
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 Usage

1. **Upload PDF**: Click "Choose PDF File" or drag & drop a PDF file
2. **Configure Headers**: Select templates for left, middle, or right header positions
3. **Configure Footers**: Set up footer content with page numbering options
4. **Set Options**: 
   - Choose start page number
   - Enable white background overlay if needed
5. **Process**: Click "Add Header & Footer" to download the processed PDF

## 📝 Available Templates

- `Page (x) of (y)` - Full page numbering (e.g., "Page 1 of 10")
- `(x) of (y)` - Simple page numbering (e.g., "1 of 10")
- `Page (x)` - Page with number (e.g., "Page 1")
- `(x)` - Just the page number (e.g., "1")
- `(file)` - Document name placeholder

## 🚀 API Endpoints

### POST /api/process-pdf
Processes a PDF file with header and footer data.

**Request:**
- `pdf` (file): PDF file to process
- `headerFooterData` (JSON): Configuration object

**Response:**
- Processed PDF file for download

### GET /api/health
Health check endpoint.

## 📁 Project Structure

```
pdf-dost/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PDFEditor.js
│   │   │   └── PDFEditor.css
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Main server file
│   └── uploads/           # Temporary upload directory
├── .github/
│   └── copilot-instructions.md
├── package.json
└── README.md
```

## 🎨 Design Features

- **Modern UI**: Gradient backgrounds and glassmorphism effects
- **Dark Theme**: Professional dark color scheme
- **Responsive**: Works on desktop, tablet, and mobile
- **Intuitive**: Clean and user-friendly interface
- **Animations**: Smooth transitions and hover effects

## 🔧 Development

### Frontend Development
```bash
cd client
npm start
```

### Backend Development
```bash
npm run server
```

### Building for Production
```bash
cd client
npm run build
```

## 🐛 Known Issues

- Large PDF files may take longer to process
- Some complex PDF layouts might have positioning issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **PDF Dost Team** - Full-stack PDF solution developers

## 🙏 Acknowledgments

- pdf-lib library for PDF manipulation
- React community for excellent documentation
- Node.js ecosystem for robust backend tools
