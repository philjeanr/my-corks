// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

if (!userId) {
    window.location.href = 'index.html';
}

// Popup elements
const popup = document.getElementById('add-bottle-popup');
const addBottleBtn = document.getElementById('add-bottle-btn');
const closeBtn = document.querySelector('.close');
const addBottleForm = document.getElementById('add-bottle-form');

// Open popup
addBottleBtn.onclick = function() {
    popup.style.display = "block";
}

// Close popup
closeBtn.onclick = function() {
    popup.style.display = "none";
}

// Close popup when clicking outside
window.onclick = function(event) {
    if (event.target == popup) {
        popup.style.display = "none";
    }
}

// Handle form submission
addBottleForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(addBottleForm);
    const bottleData = {
        name: formData.get('name'),
        region: formData.get('region'),
        cepage: formData.get('cepage'),
        year: parseInt(formData.get('year'))
    };

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const bottles = userData.bottles || [];
        bottles.push(bottleData);

        await userRef.update({ bottles });
        
        // Clear form and close popup
        addBottleForm.reset();
        popup.style.display = "none";
        
        // Refresh bottle list
        displayBottles(bottles);
    } catch (error) {
        console.error("Error adding bottle:", error);
        alert("Failed to add bottle. Please try again.");
    }
};

// Fetch and display user details
async function fetchUserDetails() {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        document.getElementById('user-name').textContent = `${userData.name}, these are your corks!`;
        
        if (userData.bottles && userData.bottles.length > 0) {
            displayBottles(userData.bottles);
        } else {
            document.getElementById('bottles-list').innerHTML = '<p>No bottles in collection yet.</p>';
        }
    } catch (error) {
        console.error("Error fetching user details:", error);
        document.getElementById('user-name').textContent = 'Error loading user';
    }
}

// Display bottles
function displayBottles(bottles) {
    const bottlesList = document.getElementById('bottles-list');
    bottlesList.innerHTML = bottles.map((bottle, index) => `
        <div class="bottle-card" style="background-color: var(--light-red); padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p><strong>${bottle.name}</strong></p>
                    <p>Region: ${bottle.region} | Cepage: ${bottle.cepage} | Year: ${bottle.year}</p>
                </div>
                <button class="button" onclick="deleteBottle(${index})">I drank it!</button>
            </div>
        </div>
    `).join('');
}

// Delete bottle
async function deleteBottle(index) {
    if (!confirm('Are you sure you want to remove this bottle?')) {
        return;
    }

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const bottles = userData.bottles || [];
        bottles.splice(index, 1);

        await userRef.update({ bottles });
        displayBottles(bottles);
    } catch (error) {
        console.error("Error deleting bottle:", error);
        alert("Failed to delete bottle. Please try again.");
    }
}

// Initialize
fetchUserDetails(); 