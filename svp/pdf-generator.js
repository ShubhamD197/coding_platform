function generatePDF() {
    // Check if there's any successful execution
    if (!outputHistory.length) {
        appendToTerminal('No code execution history to download', 'error-line');
        return;
    }

    // Create new jsPDF instance
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yOffset = 30;

    // Add experiment heading
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('EXPERIMENT', pageWidth/2, yOffset, { align: 'center' });
    yOffset += 25;

    // Add question section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Question:', 20, yOffset);
    yOffset += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(document.getElementById('problemText').innerText, 20, yOffset);
    yOffset += 20;

    // Add code section with title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Source Code:', 20, yOffset);
    yOffset += 10;

    // Add the code with proper formatting
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    const codeLines = currentCode.split('\n');
    codeLines.forEach(line => {
        if (yOffset > 270) { // Check if we need a new page
            doc.addPage();
            yOffset = 20;
        }
        doc.text(line, 25, yOffset);
        yOffset += 6; // Increased line spacing
    });

    yOffset += 20; // Increased spacing between sections

    // Add output section with title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Execution Output:', 20, yOffset);
    yOffset += 10;

    // Add the output history with black background
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    outputHistory.forEach(entry => {
        if (yOffset > 270) { // Check if we need a new page
            doc.addPage();
            yOffset = 20;
        }
        
        // Add black background for output with increased height to fill gaps
        doc.setFillColor(0, 0, 0);
        doc.rect(20, yOffset - 4, pageWidth - 40, 14, 'F'); // Increased height to match line spacing
        
        // Set text color based on output type
        if (entry.className.includes('error-line')) {
            doc.setTextColor(255, 100, 100); // Light red for errors
        } else if (entry.className.includes('success-line')) {
            doc.setTextColor(100, 255, 100); // Light green for success
            doc.setCharSpace(0); // Reset character spacing for success messages
        } else {
            doc.setTextColor(255, 255, 255); // White for system messages
        }

        doc.text(entry.text, 25, yOffset);
        yOffset += 14; // Maintain the same spacing between lines
    });


    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Save the PDF
    doc.save('code-execution-report.pdf');
}