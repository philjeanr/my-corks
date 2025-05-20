// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView();
    });
});

// Add click handler to the CTA button
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('click', function() {
        document.querySelector('#home').scrollIntoView();
    });
}

// Fetch and display users
async function displayUsers() {
    const usersList = document.getElementById('users-list');
    
    try {
        // Get all documents from the users collection
        const querySnapshot = await db.collection('users').get();
        
        // Clear existing content
        usersList.innerHTML = '';
        
        // Check if there are any users
        if (querySnapshot.empty) {
            usersList.innerHTML = '<p class="no-users">No users found</p>';
            return;
        }
        
        // Loop through each document
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <a href="user.html?id=${doc.id}">
                    <h3>${userData.name || 'Anonymous'}</h3>
                </a>
            `;
            usersList.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        usersList.innerHTML = '<p class="error">Error loading users</p>';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    displayUsers();
}); 