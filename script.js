// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView();
    });
});

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
            usersList.innerHTML = '<p>No users found</p>';
            return;
        }
        
        // Loop through each document
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const userCard = document.createElement('div');
            userCard.className = 'button';
            userCard.innerHTML = `
                <a href="user.html?id=${doc.id}" style="color: white; text-decoration: none;">
                    <h3>${userData.name || 'Anonymous'}</h3>
                </a>
            `;
            usersList.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        usersList.innerHTML = '<p>Error loading users</p>';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    displayUsers();
}); 