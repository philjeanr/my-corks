// Import OpenAI configuration
import { OPENAI_API_KEY } from './openai-config.js';

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

if (!userId) {
    window.location.href = 'index.html';
}

// Modal elements
const modal = document.getElementById('add-bottle-modal');
const addBottleBtn = document.getElementById('add-bottle-btn');
const closeBtn = document.querySelector('.close');
const addBottleForm = document.getElementById('add-bottle-form');
const manualEntryBtn = document.getElementById('manual-entry-btn');
const scanBottleBtn = document.getElementById('scan-bottle-btn');
const scanBottleForm = document.getElementById('scan-bottle-form');
const useCameraBtn = document.getElementById('use-camera-btn');
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
const photoUpload = document.getElementById('photo-upload');
const cameraContainer = document.querySelector('.camera-container');
const previewContainer = document.querySelector('.preview-container');
const cameraPreview = document.getElementById('camera-preview');
const uploadPreview = document.getElementById('upload-preview');
const captureCanvas = document.getElementById('capture-canvas');
const captureBtn = document.getElementById('capture-btn');
const analyzeUploadBtn = document.getElementById('analyze-upload-btn');
const retryBtn = document.getElementById('retry-btn');
const scanningStatus = document.getElementById('scanning-status');

// Additional modal elements
const confirmationDialog = document.getElementById('confirmation-dialog');
const confirmNameInput = document.getElementById('confirm-name');
const confirmRegionInput = document.getElementById('confirm-region');
const confirmCepageInput = document.getElementById('confirm-cepage');
const confirmYearInput = document.getElementById('confirm-year');
const confirmInfoBtn = document.getElementById('confirm-info');
const cancelInfoBtn = document.getElementById('cancel-info');

let stream = null;

// Open modal
addBottleBtn.onclick = function() {
    modal.style.display = "block";
    addBottleForm.style.display = "none";
    scanBottleForm.style.display = "none";
}

// Close modal and cleanup
function closeModal() {
    modal.style.display = "none";
    addBottleForm.style.display = "none";
    scanBottleForm.style.display = "none";
    resetScanForm();
    stopCamera();
}

// Reset scan form
function resetScanForm() {
    cameraContainer.style.display = "none";
    previewContainer.style.display = "none";
    captureBtn.style.display = "none";
    analyzeUploadBtn.style.display = "none";
    retryBtn.style.display = "none";
    scanningStatus.style.display = "none";
    captureCanvas.style.display = "none";
    confirmationDialog.style.display = "none";
    uploadPreview.src = "";
    if (photoUpload) {
        photoUpload.value = "";
    }
}

// Close modal
closeBtn.onclick = closeModal;

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Show manual entry form
manualEntryBtn.onclick = function() {
    addBottleForm.style.display = "flex";
    scanBottleForm.style.display = "none";
    stopCamera();
}

// Show scan bottle form
scanBottleBtn.onclick = function() {
    addBottleForm.style.display = "none";
    scanBottleForm.style.display = "block";
    resetScanForm();
}

// Use camera option
useCameraBtn.onclick = async function() {
    resetScanForm();
    cameraContainer.style.display = "block";
    captureBtn.style.display = "block";
    await startCamera();
}

// Upload photo option
uploadPhotoBtn.onclick = function() {
    if (photoUpload) {
        photoUpload.click();
    }
}

// Handle file selection
photoUpload.onchange = function(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    resetScanForm();
    previewContainer.style.display = "block";
    analyzeUploadBtn.style.display = "block";
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (e.target?.result && uploadPreview) {
            uploadPreview.src = e.target.result.toString();
        }
    };
    reader.onerror = function() {
        alert('Error reading file');
        resetScanForm();
    };
    reader.readAsDataURL(file);
}

// Start camera stream
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        });
        if (cameraPreview) {
            cameraPreview.srcObject = stream;
            captureBtn.style.display = "block";
            retryBtn.style.display = "none";
            scanningStatus.style.display = "none";
        }
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Error accessing camera. Please make sure you have granted camera permissions.');
    }
}

// Stop camera stream
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Capture image
captureBtn.onclick = async function() {
    if (!stream) return;

    // Setup canvas
    const video = cameraPreview;
    const canvas = captureCanvas;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Capture frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 with compression
    const maxWidth = 1024;
    const maxHeight = 1024;
    
    // Scale down if necessary
    let finalWidth = canvas.width;
    let finalHeight = canvas.height;
    
    if (canvas.width > maxWidth || canvas.height > maxHeight) {
        const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        finalWidth = Math.floor(canvas.width * ratio);
        finalHeight = Math.floor(canvas.height * ratio);
        
        // Create a temporary canvas for resizing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = finalWidth;
        tempCanvas.height = finalHeight;
        const tempContext = tempCanvas.getContext('2d');
        if (!tempContext) return;
        
        tempContext.drawImage(canvas, 0, 0, finalWidth, finalHeight);
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        context.drawImage(tempCanvas, 0, 0);
    }
    
    // Convert to base64 with quality adjustment
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera and show retry button
    stopCamera();
    video.style.display = "none";
    canvas.style.display = "block";
    captureBtn.style.display = "none";
    retryBtn.style.display = "block";
    scanningStatus.style.display = "block";

    try {
        await processImageWithConfirmation(imageData, true);
    } catch (error) {
        if (error.message !== 'User cancelled') {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
            retryCapture();
        }
    }
}

// Analyze uploaded image
analyzeUploadBtn.onclick = async function() {
    if (!uploadPreview || !uploadPreview.src) return;
    
    analyzeUploadBtn.style.display = "none";
    retryBtn.style.display = "block";
    scanningStatus.style.display = "block";

    try {
        await processImageWithConfirmation(uploadPreview.src, false);
    } catch (error) {
        if (error.message !== 'User cancelled') {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
            retryBtn.style.display = "block";
        }
    }
}

// Retry capture/upload
retryBtn.onclick = function() {
    resetScanForm();
    if (stream) {
        // If we were using camera, restart it
        cameraContainer.style.display = "block";
        if (cameraPreview) {
            cameraPreview.style.display = "block";
        }
        captureBtn.style.display = "block";
        startCamera();
    } else {
        // If we were uploading, show upload preview
        uploadPhotoBtn.click();
    }
}

// Analyze image using ChatGPT Vision
async function analyzeImage(imageData) {
    try {
        scanningStatus.innerHTML = '<p>Analyzing image with ChatGPT...</p>';
        
        // Remove the "data:image/jpeg;base64," prefix if present
        const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyze this wine bottle label and extract the following information. Return the data as a plain JSON object (not in a markdown code block) with this exact format:\n\n{\n  \"wine_name\": \"<name or 'unknown'>\",\n  \"region\": \"<region or 'unknown'>\",\n  \"cepage\": \"<grape variety or 'unknown'>\",\n  \"year\": \"<year as number or 'unknown'>\"\n}\n\nDo not include any other text, markdown formatting, or explanations in your response."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Response:', errorData);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Complete OpenAI API Response:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API Response Structure:', data);
            throw new Error('Invalid response format from API');
        }
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing image:', error);
        scanningStatus.innerHTML = `<p>Error: ${error.message}</p>`;
        throw error;
    }
}

// Process image analysis result
function processImageAnalysisResult(result) {
    try {
        // Clean up the response - remove markdown code block formatting if present
        let cleanResult = result.trim();
        if (cleanResult.startsWith('```')) {
            cleanResult = cleanResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }
        console.log('Cleaned result:', cleanResult);

        // Try to parse the JSON response
        let extractedData;
        try {
            extractedData = JSON.parse(cleanResult);
            console.log('Parsed JSON data:', extractedData);
        } catch (e) {
            console.error('Failed to parse JSON response:', cleanResult);
            throw new Error('Invalid response format: not valid JSON');
        }

        // Validate the required fields
        const requiredFields = ['wine_name', 'region', 'cepage', 'year'];
        const missingFields = requiredFields.filter(field => !(field in extractedData));
        
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            throw new Error(`Invalid response format: missing fields: ${missingFields.join(', ')}`);
        }

        // Convert the data to our format
        const processedData = {
            name: extractedData.wine_name === 'unknown' ? 'Unknown' : extractedData.wine_name,
            region: extractedData.region === 'unknown' ? 'Unknown' : extractedData.region,
            cepage: extractedData.cepage === 'unknown' ? 'Unknown' : extractedData.cepage,
            year: extractedData.year === 'unknown' ? 'Unknown' : Number(extractedData.year)
        };

        console.log('Processed data:', processedData);
        return processedData;
    } catch (error) {
        console.error('Error processing analysis result:', error);
        throw error;
    }
}

// Add bottle to collection
async function addBottleToCollection(bottleData) {
    try {
        // Get current user document
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        // Create or update bottles array
        const bottles = userData.bottles || [];
        bottles.push(bottleData);
        
        // Update user document
        await db.collection('users').doc(userId).update({
            bottles: bottles
        });
    } catch (error) {
        console.error('Error adding bottle:', error);
        throw error;
    }
}

// Handle manual form submission
addBottleForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const newBottle = {
        name: formData.get('name'),
        region: formData.get('region'),
        cepage: formData.get('cepage'),
        year: parseInt(formData.get('year'))
    };

    try {
        await addBottleToCollection(newBottle);
        
        // Close modal and reset form
        this.reset();
        closeModal();
        
        // Refresh the bottles list
        displayUserDetails();
    } catch (error) {
        console.error('Error adding bottle:', error);
        alert('Error adding bottle. Please try again.');
    }
}

// Fetch and display user details and bottles
async function displayUserDetails() {
    const userNameElement = document.getElementById('user-name');
    const bottlesList = document.getElementById('bottles-list');
    
    try {
        // Get user document
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            window.location.href = 'index.html';
            return;
        }
        
        const userData = userDoc.data();
        
        // Display user name
        userNameElement.textContent = userData.name || 'Anonymous';
        
        // Display bottles
        if (!userData.bottles || userData.bottles.length === 0) {
            bottlesList.innerHTML = '<p class="no-bottles">No corks in cellar</p>';
            return;
        }
        
        bottlesList.innerHTML = userData.bottles.map((bottle, index) => `
            <div class="bottle-card">
                <h3>${bottle.name} - ${bottle.region} - ${bottle.cepage}  (${bottle.year})</h3>
                <button class="delete-btn" data-index="${index}">Remove</button>
            </div>
        `).join('');

        // Add click handlers for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = async function() {
                if (confirm('Are you sure you want to remove this bottle?')) {
                    const index = parseInt(this.getAttribute('data-index'));
                    try {
                        // Get current bottles array
                        const userDoc = await db.collection('users').doc(userId).get();
                        const userData = userDoc.data();
                        const bottles = userData.bottles;
                        
                        // Remove the bottle at the specified index
                        bottles.splice(index, 1);
                        
                        // Update the document with the new bottles array
                        await db.collection('users').doc(userId).update({
                            bottles: bottles
                        });
                        
                        // Refresh the display
                        displayUserDetails();
                    } catch (error) {
                        console.error('Error removing bottle:', error);
                        alert('Error removing bottle. Please try again.');
                    }
                }
            };
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        bottlesList.innerHTML = '<p class="error">Error loading bottles</p>';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', displayUserDetails);

// Cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
    stopCamera();
});

// Show confirmation dialog with extracted info
function showConfirmationDialog(bottleData) {
    confirmNameInput.value = bottleData.name;
    confirmRegionInput.value = bottleData.region;
    confirmCepageInput.value = bottleData.cepage;
    confirmYearInput.value = bottleData.year;
    
    scanningStatus.style.display = "none";
    confirmationDialog.style.display = "block";
}

// Get confirmed data from dialog
function getConfirmedData() {
    return {
        name: confirmNameInput.value,
        region: confirmRegionInput.value,
        cepage: confirmCepageInput.value,
        year: parseInt(confirmYearInput.value) || 'Unknown'
    };
}

// Process the image analysis result and show confirmation
async function processImageWithConfirmation(imageData, isCamera = false) {
    try {
        // Call OpenAI Vision API
        const result = await analyzeImage(imageData);
        
        // Log raw OpenAI response
        console.log('Raw OpenAI Response:', result);
        
        // Process the result
        const bottleData = processImageAnalysisResult(result);
        
        // Log processed data
        console.log('Processed Data:', bottleData);
        
        // Show confirmation dialog
        showConfirmationDialog(bottleData);
        
        // Handle confirmation
        return new Promise((resolve, reject) => {
            confirmInfoBtn.onclick = async () => {
                try {
                    const confirmedData = getConfirmedData();
                    await addBottleToCollection(confirmedData);
                    closeModal();
                    displayUserDetails();
                    resolve();
                } catch (error) {
                    console.error('Error saving confirmed data:', error);
                    alert('Error saving data. Please try again.');
                    reject(error);
                }
            };
            
            cancelInfoBtn.onclick = () => {
                if (isCamera) {
                    retryCapture();
                } else {
                    resetScanForm();
                    uploadPhotoBtn.click();
                }
                reject(new Error('User cancelled'));
            };
        });
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try again.');
        throw error;
    }
}

// Update capture button handler
captureBtn.onclick = async function() {
    if (!stream) return;

    // ... existing capture code ...

    try {
        await processImageWithConfirmation(imageData, true);
    } catch (error) {
        if (error.message !== 'User cancelled') {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
            retryCapture();
        }
    }
}

// Update analyze upload button handler
analyzeUploadBtn.onclick = async function() {
    if (!uploadPreview || !uploadPreview.src) return;
    
    analyzeUploadBtn.style.display = "none";
    retryBtn.style.display = "block";
    scanningStatus.style.display = "block";

    try {
        await processImageWithConfirmation(uploadPreview.src, false);
    } catch (error) {
        if (error.message !== 'User cancelled') {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
            retryBtn.style.display = "block";
        }
    }
} 