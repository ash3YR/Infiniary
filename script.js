// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCK9bZj7q3pxlSj56uZ_2HBuVF2Dof8EBI",
    authDomain: "diary-13ed1.firebaseapp.com",
    projectId: "diary-13ed1",
    storageBucket: "diary-13ed1.firebasestorage.app",
    messagingSenderId: "1070095498870",
    appId: "1:1070095498870:web:b9d18059b918aea6eaa957",
    measurementId: "G-R71S2BHJ6H"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
    prompt: 'select_account'
});

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');
    
    // Authentication UI elements
    const userInfoBar = document.getElementById('user-info-bar');
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailSpan = document.getElementById('user-email');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    let lastDate = null;
    let enterPressCount = 0;
    let lastEnterPressTime = 0;
    const DOUBLE_ENTER_TIMEOUT = 1000; // 1 second timeout for consecutive presses

    // Firestore save/load variables
    let currentUserId = null;
    let saveTimeout = null;
    const SAVE_DELAY = 2000; // 2 seconds after last keystroke to save

    // Array of vibrant, popping colors for timestamp pills
    const vibrantColors = [
        'rgba(255, 0, 0, 0.3)',      // Bright Red
        'rgba(255, 215, 0, 0.3)',    // Gold
        'rgba(0, 255, 128, 0.3)',    // Neon Green
        'rgba(0, 191, 255, 0.3)',    // Deep Sky Blue
        'rgba(255, 140, 0, 0.3)',    // Dark Orange
        'rgba(147, 112, 219, 0.3)',  // Medium Purple
        'rgba(255, 20, 147, 0.3)',   // Deep Pink
        'rgba(0, 255, 255, 0.3)',    // Cyan
        'rgba(255, 69, 0, 0.3)',     // Red-Orange
        'rgba(50, 205, 50, 0.3)',    // Lime Green
        'rgba(255, 0, 255, 0.3)',    // Magenta
        'rgba(255, 165, 0, 0.3)'     // Orange
    ];
    
    function getRandomColor() {
        return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    function createNewEntry() {
        const entry = document.createElement('div');
        entry.className = 'entry';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.style.backgroundColor = getRandomColor();
        
        const paragraph = document.createElement('p');
        paragraph.setAttribute('contenteditable', 'true');
        paragraph.setAttribute('spellcheck', 'true');
        paragraph.textContent = ''; // Ensure it's an empty, editable paragraph
        
        entry.appendChild(dateHeader);
        entry.appendChild(timestamp);
        entry.appendChild(paragraph);
        
        return entry;
    }

    function updateDateTime(entry) {
        const now = new Date();
        const currentDate = formatDate(now);
        
        // Only update date header if it's a new day
        if (currentDate !== lastDate) {
            entry.querySelector('.date-header').textContent = currentDate;
            lastDate = currentDate;
        } else {
            entry.querySelector('.date-header').style.display = 'none';
        }
        
        // Always update timestamp
        entry.querySelector('.timestamp').textContent = formatTime(now);
    }

    function setCursorAtBeginning(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        if (element.childNodes.length > 0) {
            range.setStart(element.childNodes[0], 0);
        } else {
            range.setStart(element, 0);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function updateRuledLines(paragraph) {
        // Ruled lines are applied only if the paragraph has actual text content
        if (paragraph.textContent.trim() !== '') {
            paragraph.classList.add('has-text');
        } else {
            paragraph.classList.remove('has-text');
        }
    }

    // Firebase Authentication Functions
    async function signInWithGoogle() {
        try {
            const result = await auth.signInWithPopup(provider);
            console.log('Sign-in successful:', result.user.email);
        } catch (error) {
            console.error('Google Sign-in Error:', error);
            if (error.code === 'auth/popup-blocked') {
                alert('Please allow popups for this website to sign in with Google.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log('Sign-in popup was cancelled');
            } else {
                alert('Error signing in with Google: ' + error.message);
            }
        }
    }

    async function logout() {
        try {
            await auth.signOut();
            console.log('Logged out successfully!');
        } catch (error) {
            console.error('Logout Error:', error);
            alert('Error logging out: ' + error.message);
        }
    }

    // Firestore Functions
    async function saveDiary() {
        if (!currentUserId) return; // Only save if user is logged in

        const diaryContent = content.innerHTML; // Get all HTML content of the diary
        try {
            // Use a single document for the entire diary content for simplicity
            await db.collection('diaryEntries').doc(currentUserId).set({
                content: diaryContent,
                lastSaved: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Diary saved successfully!');
        } catch (error) {
            console.error('Error saving diary:', error);
        }
    }

    async function loadDiary() {
        if (!currentUserId) return; // Only load if user is logged in

        try {
            const doc = await db.collection('diaryEntries').doc(currentUserId).get();
            if (doc.exists) {
                content.innerHTML = doc.data().content;
                console.log('Diary loaded successfully!');
                // Re-apply ruled lines based on loaded content
                content.querySelectorAll('p[contenteditable="true"]').forEach(updateRuledLines);
            } else {
                console.log('No diary found for this user, starting fresh.');
                // Reset to initial empty entry if no diary exists
                content.innerHTML = `<div class="entry"><div class="date-header"></div><div class="timestamp"></div><p contenteditable="true" spellcheck="true"></p></div>`;
                // Re-initialize date/time for the first entry
                const firstEntry = content.querySelector('.entry');
                updateDateTime(firstEntry);
                lastDate = firstEntry.querySelector('.date-header').textContent;
                firstEntry.querySelector('.timestamp').style.backgroundColor = getRandomColor();
                updateRuledLines(firstEntry.querySelector('p'));
            }
        } catch (error) {
            console.error('Error loading diary:', error);
        }
    }

    // Event Listeners for Auth Buttons
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', signInWithGoogle);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Handle username editing
    userName.addEventListener('blur', async () => {
        if (!currentUserId) return;
        
        const newName = userName.textContent.trim();
        if (newName) {
            try {
                await db.collection('users').doc(currentUserId).set({
                    displayName: newName
                }, { merge: true });
                console.log('Username updated successfully');
            } catch (error) {
                console.error('Error updating username:', error);
            }
        }
    });

    // Prevent Enter key in username
    userName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            userName.blur();
        }
    });

    // Auth state listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            currentUserId = user.uid;
            authSection.style.display = 'none';
            userInfo.style.display = 'flex';

            // Set user photo
            if (user.photoURL) {
                userPhoto.src = user.photoURL;
            } else {
                userPhoto.src = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png';
            }

            // Get or set username
            try {
                const userDoc = await db.collection('users').doc(currentUserId).get();
                if (userDoc.exists && userDoc.data().displayName) {
                    userName.textContent = userDoc.data().displayName;
                } else {
                    // Set default username from email
                    const defaultName = user.email.split('@')[0];
                    userName.textContent = defaultName;
                    // Save default name to Firestore
                    await db.collection('users').doc(currentUserId).set({
                        displayName: defaultName
                    });
                }
            } catch (error) {
                console.error('Error getting/setting username:', error);
                userName.textContent = user.email.split('@')[0];
            }

            // Load diary for the logged-in user
            loadDiary();
        } else {
            // User is signed out
            currentUserId = null;
            authSection.style.display = 'flex';
            userInfo.style.display = 'none';
            content.innerHTML = ''; // Clear diary content
        }
    });

    // Add event listener for input changes to trigger auto-save
    content.addEventListener('input', () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(saveDiary, SAVE_DELAY);
    });

    // Handle Enter key press
    content.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            const currentTime = Date.now();
            
            // Reset counter if too much time has passed since last Enter press
            if (currentTime - lastEnterPressTime > DOUBLE_ENTER_TIMEOUT) {
                enterPressCount = 0;
            }
            
            enterPressCount++;
            lastEnterPressTime = currentTime;
            
            // Check for double Enter press
            if (enterPressCount === 2) {
                // Create new entry
                const newEntry = createNewEntry();
                content.appendChild(newEntry);
                
                // Update date and time
                updateDateTime(newEntry);
                
                // Focus on the new paragraph and set cursor
                const newParagraph = newEntry.querySelector('p');
                newParagraph.focus();
                setCursorAtBeginning(newParagraph);
                
                // Reset counter
                enterPressCount = 0;
            } else {
                // Just insert a new line
                document.execCommand('insertParagraph');
            }
        } else {
            // Reset counter if any other key is pressed
            enterPressCount = 0;
        }
    });

    // Handle text input to update ruled lines
    content.addEventListener('input', (e) => {
        if (e.target.tagName === 'P') {
            updateRuledLines(e.target);
        }
    });

    // Handle focus to ensure ruled lines are updated if user clicks on an empty paragraph
    content.addEventListener('focus', (e) => {
        if (e.target.tagName === 'P') {
            updateRuledLines(e.target); 
        }
    }, true);

    // Initial setup after content is loaded
    // This will run once when the DOM is ready
    const initialFirstEntry = content.querySelector('.entry');
    if (initialFirstEntry) {
        updateDateTime(initialFirstEntry);
        lastDate = initialFirstEntry.querySelector('.date-header').textContent;
        initialFirstEntry.querySelector('.timestamp').style.backgroundColor = getRandomColor();
        updateRuledLines(initialFirstEntry.querySelector('p'));
    }
}); 