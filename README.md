# 📄 Document Analysis using Google API

## 🧠 Overview

This project is a **Document Analysis Tool** powered by **Google Cloud APIs** that automatically:

1. Extracts text from PDF documents.

2. Summarizes the key points and sections of the document.

3. Detects and highlights **risky clauses** or potentially problematic statements within legal or business documents.

It helps users quickly understand large contracts or reports by identifying areas that may require attention or legal review.

---

## 🚀 Features

* **PDF Text Extraction** – Uses Google Cloud Vision API to extract text with high accuracy.
* **Text Summarization** – Leverages advanced NLP models to generate concise summaries.
* **Risk Clause Detection** – Flags clauses containing terms related to obligations, penalties, confidentiality, or compliance risks.
* **Interactive Output** – Displays the summary and risky clauses in a clean, readable format.
* **Configurable API Key Integration** – Securely connects to your Google Cloud API.

---

## 🧩 Tech Stack

* **Language:** ts
* **APIs Used:** Google api

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/document-analysis.git
cd document-analysis
```

### 4. Set up Google Cloud credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Vision API** and **Natural Language API**.
3. Download your **API Key JSON file**.
4. Set the environment variable:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/your-api-key.json"
   ```

### Output

* **Summary:** Key sections and bullet points summarizing the document.
* **Risky Clauses:** Highlighted phrases like “termination without notice”, “non-compete”, “liability”, “penalty”, etc.

---

## 🧪 Sample Output

**Summary:**

> This contract defines the service terms between Company A and Company B. It outlines payment structure, confidentiality agreements, and termination clauses.

**Risky Clauses:**

* “The provider may terminate the agreement without prior notice.”
* “The client shall be liable for all indirect damages.”

---

## 🔒 Security

* The API key is **not hardcoded**.
* Always store credentials in environment variables or `.env` files.
* Avoid committing your API key to version control.

---

## 📈 Future Enhancements

* Add a **web-based dashboard** for document uploads and visualization.
* Integrate **machine learning models** for deeper clause classification.
* Provide **confidence scores** for risk detection.
* Support for **multiple languages** and OCR for scanned documents.

---

## 👨‍💻 Author

**Praveen Ramisetti**
📧 [praveen_ramisetti@srmap.edu.in](mailto:praveen_ramisetti@srmap.edu.in)
🌐 

---

## 🪪 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
