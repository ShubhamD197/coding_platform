const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";
const API_KEY = process.env.RAPIDAPI_KEY;

// Language ID mapping for Judge0 API
const LANGUAGE_IDS = {
  "python": 71,  // Python 3
  "cpp": 54,     // C++ (GCC 9.2.0)
  "c": 50,       // C (GCC 9.2.0)
  "java": 62     // Java (OpenJDK 13.0.1)
};

app.post("/execute", async (req, res) => {
    const { language, code } = req.body;

    if (!language || !code) {
        return res.json({ error: "Missing language or code input" });
    }

    const languageId = LANGUAGE_IDS[language] || 71; // Default to Python if language not found

    try {
        // Submit code to Judge0
        const submissionResponse = await axios.post(`${JUDGE0_API}?base64_encoded=false&wait=false`, {
            language_id: languageId,
            source_code: code,
            wait: true  // Wait for execution to complete
        }, {
            headers: {
                "content-type": "application/json",
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                "x-rapidapi-key": API_KEY,
            }
        });

        const token = submissionResponse.data.token;
        if (!token) return res.json({ error: "No token received from Judge0 API" });

        console.log("Received Token:", token);
        
        // Poll until execution completes
        let result = null;
        let maxAttempts = 10;
        
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 sec

            const resultResponse = await axios.get(`${JUDGE0_API}/${token}?base64_encoded=false`, {
                headers: {
                    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                    "x-rapidapi-key": API_KEY,
                }
            });

            result = resultResponse.data;
            console.log("Judge0 Response:", result);

            // If execution completed, break the loop
            if (result.status && result.status.id >= 3) {
                break;
            }
        }

        if (!result) {
            return res.json({ error: "Code execution took too long" });
        }

        // Return execution results
        res.json({
            output: result.stdout || "",
            error: result.stderr || result.compile_output || "",
            exit_code: result.exit_code,
            status: result.status
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.json({ error: "Server Error while executing code" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));