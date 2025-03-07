// Global variables to store execution state
let currentLanguage = 'python';
let outputHistory = [];
let currentCode = ''; // Store the current code being executed
let isExecuting = false; // Flag to track if execution is in progress

// Example code for different languages
const examples = {
    python: `def main():
    # Code here
    pass

if __name__ == "__main__":
    main()

`,
    cpp: `#include <iostream>

int main() {
    // Code here
    return 0;
}

`,
    java: `public class Main {
    public static void main(String[] args) {
        // Code here
    }
}

`,
    c: `#include <stdio.h>

int main() {
    // Code here
    return 0;
}

`
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Setup keyboard shortcuts
    document.getElementById('codeEditor').addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
    
    // Set up language change handler
    const languageSelect = document.getElementById('language');
    languageSelect.addEventListener('change', function() {
        currentLanguage = this.value;
        updatePlaceholder();
    });
    
    // Set initial placeholder
    updatePlaceholder();
    
    // Check if we have question details in localStorage
    loadQuestionFromLocalStorage();
    
    // Disable download button by default
    document.getElementById('downloadButton').disabled = true;
});

function loadQuestionFromLocalStorage() {
    const language = localStorage.getItem('questionLanguage');
    const title = localStorage.getItem('questionTitle');
    const description = localStorage.getItem('questionDescription');
    const input = localStorage.getItem('questionInput');
    const output = localStorage.getItem('questionOutput');
    
    if (language && title && description) {
        // Set the language
        document.getElementById('language').value = language;
        currentLanguage = language;
        updatePlaceholder();
        
        // Set the problem description
        if (title) {
            document.querySelector('.problem-header h2').textContent = title;
        }
        
        if (description) {
            document.getElementById('problemText').textContent = description;
        }
        
        if (input) {
            document.getElementById('exampleInput').textContent = input;
        }
        
        if (output) {
            document.getElementById('expectedOutput').textContent = output;
        }
    }
}

function updatePlaceholder() {
    const codeEditor = document.getElementById('codeEditor');
    codeEditor.placeholder = examples[currentLanguage] || '';
}

function appendToTerminal(text, className = '') {
    const terminalOutput = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.textContent = text;
    line.className = `output-line ${className}`;
    terminalOutput.appendChild(line);
    
    // Scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    
    // Add to history
    outputHistory.push({text, className});
}

function clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
    outputHistory = [];
}

function showLoading() {
    const loadingLine = document.createElement('div');
    loadingLine.className = 'output-line loading';
    loadingLine.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Running code...
    `;
    loadingLine.id = 'loading-indicator';
    
    const terminalOutput = document.getElementById('terminal-output');
    terminalOutput.appendChild(loadingLine);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function hideLoading() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}

function runCode() {
    const code = document.getElementById('codeEditor').value;
    currentLanguage = document.getElementById('language').value;
    currentCode = code; // Store the current code
    
    if (!code.trim()) {
        appendToTerminal('Error: Please enter some code to run', 'error-line');
        return;
    }
    
    isExecuting = true;
    
    // Clear previous output history before new execution
    outputHistory = [];
    
    // Disable run button during execution
    const runButton = document.getElementById('runButton');
    runButton.disabled = true;
    
    // Add execution divider
    appendToTerminal('\n$ Running code...', 'system-line');
    showLoading();
    
    // Execute code
    executeCode(code);
}

function executeCode(code) {
    fetch('http://localhost:3000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            language: currentLanguage,
            code: code
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.error === 'Server Error while executing code') {
            appendToTerminal('Server error. Please try again later.', 'error-line');
            isExecuting = false;
            document.getElementById('runButton').disabled = false;
            return;
        }
        
        // Handle program output
        handleProgramOutput(data);
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        appendToTerminal('Network error. Please check if the server is running.', 'error-line');
        isExecuting = false;
        document.getElementById('runButton').disabled = false;
    });
}

function handleProgramOutput(data) {
    // Display stdout if available
    if (data.output) {
        appendToTerminal(data.output, 'success-line');
    }
    
    // Display compilation errors or stderr
    if (data.error) {
        appendToTerminal(data.error, 'error-line');
    }
    
    // If there was an exit code, display it
    if (data.exit_code !== undefined && data.exit_code !== 0) {
        appendToTerminal(`Process exited with code ${data.exit_code}`, 'system-line');
    }
    
    if (data.status && data.status.id >= 3) {
        appendToTerminal('Execution completed', 'system-line');
        isExecuting = false;
        document.getElementById('runButton').disabled = false;
    }
}


function submitSolution() {
    const code = document.getElementById('codeEditor').value;
    currentLanguage = document.getElementById('language').value;
    
    if (!code.trim()) {
        appendToTerminal('Error: Please enter some code to submit', 'error-line');
        return;
    }
    
    isExecuting = true;
    const runButton = document.getElementById('runButton');
    const submitButton = document.getElementById('submitButton');
    const downloadButton = document.getElementById('downloadButton');
    runButton.disabled = true;
    submitButton.disabled = true;
    
    appendToTerminal('\n$ Submitting solution...', 'system-line');
    showLoading();
    
    // Execute code and validate output
    fetch('http://localhost:3000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            language: currentLanguage,
            code: code
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.error === 'Server Error while executing code') {
            appendToTerminal('Server error. Please try again later.', 'error-line');
            isExecuting = false;
            runButton.disabled = false;
            submitButton.disabled = false;
            return;
        }
        
        // Get expected output from the problem description
        const expectedOutput = document.getElementById('expectedOutput').textContent.trim();
        const actualOutput = data.output ? data.output.trim() : '';
        
        // Compare outputs
        if (actualOutput === expectedOutput) {
            appendToTerminal('Congratulations! Your solution is correct!', 'success-line');
            // Enable download button only on successful submission
            downloadButton.disabled = false;
        } else {
            appendToTerminal('❌ Solution incorrect. Expected output does not match.', 'error-line');
            appendToTerminal(`Expected: ${expectedOutput}`, 'system-line');
            appendToTerminal(`Actual: ${actualOutput}`, 'system-line');
            // Ensure download button is disabled for incorrect solutions
            downloadButton.disabled = true;
        }
        
        isExecuting = false;
        runButton.disabled = false;
        submitButton.disabled = false;
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        appendToTerminal('Network error. Please check if the server is running.', 'error-line');
        isExecuting = false;
        runButton.disabled = false;
        submitButton.disabled = false;
    });
}