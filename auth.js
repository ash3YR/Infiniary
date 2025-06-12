// Paste your firebaseConfig object here
// const firebaseConfig = { /* ... your config ... */ };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // Authentication UI elements
    const authSection = document.getElementById('auth-section');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn'); // New Google button

    // Google Auth Provider
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // Firebase Authentication functions
    async function signup() {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            alert('Signed up successfully! Redirecting to diary...');
            window.location.href = 'index.html'; // Redirect to diary page
        } catch (error) {
            alert('Signup Error: ' + error.message);
            console.error('Signup Error:', error);
        }
    }

    async function login() {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            alert('Logged in successfully! Redirecting to diary...');
            window.location.href = 'index.html'; // Redirect to diary page
        } catch (error) {
            alert('Login Error: ' + error.message);
            console.error('Login Error:', error);
        }
    }

    async function signInWithGoogle() {
        try {
            await auth.signInWithPopup(googleProvider);
            alert('Signed in with Google successfully! Redirecting to diary...');
            // Redirection is handled by auth.onAuthStateChanged listener below, but an alert is nice.
        } catch (error) {
            alert('Google Sign-In Error: ' + error.message);
            console.error('Google Sign-In Error:', error);
        }
    }

    // Event Listeners for Auth Buttons
    if (signupBtn) signupBtn.addEventListener('click', signup);
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', signInWithGoogle); // New Google button listener

    // Redirect if user is already logged in on auth.html
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, redirect to main diary page
            window.location.href = 'index.html';
        }
        // If not logged in, remain on auth.html
    });
}); 