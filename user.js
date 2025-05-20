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

// Open modal
addBottleBtn.onclick = function() {
    modal.style.display = "block";
}

// Close modal
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Handle form submission
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
        // Get current user document
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        // Create or update bottles array
        const bottles = userData.bottles || [];
        bottles.push(newBottle);
        
        // Update user document
        await db.collection('users').doc(userId).update({
            bottles: bottles
        });
        
        // Close modal and reset form
        modal.style.display = "none";
        this.reset();
        
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