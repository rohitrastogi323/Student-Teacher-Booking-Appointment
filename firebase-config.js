/**
 * Firebase Configuration for Student-Teacher Booking Appointment System
 * 
 * NOTE: Replace the configuration below with your actual Firebase project credentials.
 * To get your Firebase config:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing project
 * 3. Click on the gear icon (Settings) > Project settings
 * 4. Scroll down to "Your apps" section and click on the web app (</>)
 * 5. Copy the firebaseConfig object
 */

// Firebase configuration object
const firebaseConfig = {
    // TODO: Replace with your Firebase project configuration
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

/**
 * Initialize Firebase
 * This function should be called when the application starts
 */
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            Logger.info('Firebase', 'Firebase initialized successfully', {
                projectId: firebaseConfig.projectId
            });
        } else {
            Logger.debug('Firebase', 'Firebase already initialized', {});
        }
        
        // Initialize Firestore
        const db = firebase.firestore();
        
        // Enable offline persistence
        db.enablePersistence()
            .then(() => {
                Logger.info('Firebase', 'Firestore offline persistence enabled', {});
            })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    Logger.warn('Firebase', 'Multiple tabs open, persistence can only be enabled in one tab at a time', {});
                } else if (err.code === 'unimplemented') {
                    Logger.warn('Firebase', 'Browser does not support offline persistence', {});
                }
            });
        
        // Initialize Firebase Auth
        const auth = firebase.auth();
        
        // Set authentication state persistence
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                Logger.info('Firebase', 'Auth persistence set to LOCAL', {});
            })
            .catch((error) => {
                Logger.error('Firebase', 'Error setting auth persistence', {
                    error: error.message
                });
            });
        
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                Logger.logAuth('auth_state_changed', user.uid, true, {
                    email: user.email,
                    emailVerified: user.emailVerified
                });
            } else {
                Logger.info('Firebase', 'User signed out', {});
            }
        });
        
        return {
            db: db,
            auth: auth,
            storage: firebase.storage(),
            analytics: firebase.analytics()
        };
        
    } catch (error) {
        Logger.error('Firebase', 'Error initializing Firebase', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Get Firestore database instance
 * @returns {firebase.firestore.Firestore} Firestore instance
 */
function getFirestore() {
    return firebase.firestore();
}

/**
 * Get Firebase Auth instance
 * @returns {firebase.auth.Auth} Auth instance
 */
function getAuth() {
    return firebase.auth();
}

/**
 * Get Firebase Storage instance
 * @returns {firebase.storage.Storage} Storage instance
 */
function getStorage() {
    return firebase.storage();
}

/**
 * Collection references
 */
const Collections = {
    USERS: 'users',
    TEACHERS: 'teachers',
    STUDENTS: 'students',
    ADMINS: 'admins',
    APPOINTMENTS: 'appointments',
    MESSAGES: 'messages',
    LOGS: 'logs',
    NOTIFICATIONS: 'notifications'
};

/**
 * Database operations wrapper with logging
 */
const Database = {
    /**
     * Add document to collection
     * @param {string} collection - Collection name
     * @param {Object} data - Document data
     * @returns {Promise<string>} Document ID
     */
    add: async function(collection, data) {
        try {
            const db = getFirestore();
            const docRef = await db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.logDatabase('add', collection, {
                docId: docRef.id,
                data: data
            });
            
            return docRef.id;
        } catch (error) {
            Logger.error('Database', `Error adding document to ${collection}`, {
                error: error.message,
                collection: collection,
                data: data
            });
            throw error;
        }
    },

    /**
     * Set document with specific ID
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @param {Object} data - Document data
     */
    set: async function(collection, docId, data) {
        try {
            const db = getFirestore();
            await db.collection(collection).doc(docId).set({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.logDatabase('set', collection, {
                docId: docId,
                data: data
            });
        } catch (error) {
            Logger.error('Database', `Error setting document in ${collection}`, {
                error: error.message,
                collection: collection,
                docId: docId
            });
            throw error;
        }
    },

    /**
     * Update document
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @param {Object} data - Data to update
     */
    update: async function(collection, docId, data) {
        try {
            const db = getFirestore();
            await db.collection(collection).doc(docId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.logDatabase('update', collection, {
                docId: docId,
                data: data
            });
        } catch (error) {
            Logger.error('Database', `Error updating document in ${collection}`, {
                error: error.message,
                collection: collection,
                docId: docId
            });
            throw error;
        }
    },

    /**
     * Delete document
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     */
    delete: async function(collection, docId) {
        try {
            const db = getFirestore();
            await db.collection(collection).doc(docId).delete();
            
            Logger.logDatabase('delete', collection, {
                docId: docId
            });
        } catch (error) {
            Logger.error('Database', `Error deleting document from ${collection}`, {
                error: error.message,
                collection: collection,
                docId: docId
            });
            throw error;
        }
    },

    /**
     * Get document by ID
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<Object|null>} Document data or null
     */
    get: async function(collection, docId) {
        try {
            const db = getFirestore();
            const doc = await db.collection(collection).doc(docId).get();
            
            Logger.logDatabase('get', collection, {
                docId: docId,
                exists: doc.exists
            });
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            Logger.error('Database', `Error getting document from ${collection}`, {
                error: error.message,
                collection: collection,
                docId: docId
            });
            throw error;
        }
    },

    /**
     * Get all documents from collection
     * @param {string} collection - Collection name
     * @param {Object} options - Query options (where, orderBy, limit)
     * @returns {Promise<Array>} Array of documents
     */
    getAll: async function(collection, options = {}) {
        try {
            const db = getFirestore();
            let query = db.collection(collection);
            
            // Apply where clauses
            if (options.where) {
                options.where.forEach(condition => {
                    query = query.where(condition.field, condition.operator, condition.value);
                });
            }
            
            // Apply ordering
            if (options.orderBy) {
                query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
            }
            
            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const snapshot = await query.get();
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            Logger.logDatabase('getAll', collection, {
                count: documents.length,
                options: options
            });
            
            return documents;
        } catch (error) {
            Logger.error('Database', `Error getting documents from ${collection}`, {
                error: error.message,
                collection: collection,
                options: options
            });
            throw error;
        }
    },

    /**
     * Real-time listener for collection
     * @param {string} collection - Collection name
     * @param {Function} callback - Callback function
     * @param {Object} options - Query options
     * @returns {Function} Unsubscribe function
     */
    listen: function(collection, callback, options = {}) {
        const db = getFirestore();
        let query = db.collection(collection);
        
        if (options.where) {
            options.where.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
        }
        
        if (options.orderBy) {
            query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
        }
        
        return query.onSnapshot(
            (snapshot) => {
                const documents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                Logger.logDatabase('listen', collection, {
                    count: documents.length,
                    changes: snapshot.docChanges().length
                });
                
                callback(documents);
            },
            (error) => {
                Logger.error('Database', `Error in listener for ${collection}`, {
                    error: error.message,
                    collection: collection
                });
            }
        );
    },

    /**
     * Query with multiple conditions
     * @param {string} collection - Collection name
     * @param {Array} conditions - Array of where conditions
     * @returns {Promise<Array>} Array of matching documents
     */
    query: async function(collection, conditions) {
        try {
            const db = getFirestore();
            let query = db.collection(collection);
            
            conditions.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
            
            const snapshot = await query.get();
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            Logger.logDatabase('query', collection, {
                count: documents.length,
                conditions: conditions
            });
            
            return documents;
        } catch (error) {
            Logger.error('Database', `Error querying ${collection}`, {
                error: error.message,
                collection: collection,
                conditions: conditions
            });
            throw error;
        }
    },

    /**
     * Batch write operation
     * @param {Array} operations - Array of write operations
     */
    batch: async function(operations) {
        try {
            const db = getFirestore();
            const batch = db.batch();
            
            operations.forEach(op => {
                const ref = db.collection(op.collection).doc(op.docId || generateId());
                if (op.type === 'set') {
                    batch.set(ref, {
                        ...op.data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else if (op.type === 'update') {
                    batch.update(ref, {
                        ...op.data,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else if (op.type === 'delete') {
                    batch.delete(ref);
                }
            });
            
            await batch.commit();
            
            Logger.logDatabase('batch', 'multiple', {
                operationCount: operations.length
            });
        } catch (error) {
            Logger.error('Database', 'Error in batch operation', {
                error: error.message,
                operations: operations
            });
            throw error;
        }
    },

    /**
     * Transaction operation
     * @param {Function} updateFunction - Transaction update function
     */
    transaction: async function(updateFunction) {
        try {
            const db = getFirestore();
            await db.runTransaction(updateFunction);
            
            Logger.logDatabase('transaction', 'executed', {});
        } catch (error) {
            Logger.error('Database', 'Error in transaction', {
                error: error.message
            });
            throw error;
        }
    }
};

/**
 * Authentication operations
 */
const Auth = {
    /**
     * Register new user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User credential
     */
    register: async function(email, password) {
        try {
            const auth = getAuth();
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            Logger.logAuth('register', userCredential.user.uid, true, {
                email: email
            });
            
            return userCredential.user;
        } catch (error) {
            Logger.logAuth('register', null, false, {
                email: email,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User credential
     */
    login: async function(email, password) {
        try {
            const auth = getAuth();
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            Logger.logAuth('login', userCredential.user.uid, true, {
                email: email
            });
            
            return userCredential.user;
        } catch (error) {
            Logger.logAuth('login', null, false, {
                email: email,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Logout current user
     */
    logout: async function() {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            await auth.signOut();
            
            if (user) {
                Logger.logAuth('logout', user.uid, true, {});
            }
        } catch (error) {
            Logger.error('Auth', 'Error during logout', {
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Send password reset email
     * @param {string} email - User email
     */
    resetPassword: async function(email) {
        try {
            const auth = getAuth();
            await auth.sendPasswordResetEmail(email);
            
            Logger.info('Auth', 'Password reset email sent', {
                email: email
            });
        } catch (error) {
            Logger.error('Auth', 'Error sending password reset email', {
                email: email,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Update user profile
     * @param {Object} profile - Profile data
     */
    updateProfile: async function(profile) {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            
            if (user) {
                await user.updateProfile(profile);
                
                Logger.logAuth('updateProfile', user.uid, true, {
                    profile: profile
                });
            }
        } catch (error) {
            Logger.error('Auth', 'Error updating profile', {
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser: function() {
        const auth = getAuth();
        return auth.currentUser;
    },

    /**
     * Listen to auth state changes
     * @param {Function} callback - Callback function
     */
    onAuthStateChanged: function(callback) {
        const auth = getAuth();
        return auth.onAuthStateChanged(callback);
    }
};

/**
 * Storage operations
 */
const Storage = {
    /**
     * Upload file
     * @param {string} path - Storage path
     * @param {File} file - File to upload
     * @returns {Promise<string>} Download URL
     */
    upload: async function(path, file) {
        try {
            const storage = getStorage();
            const ref = storage.ref(path);
            const snapshot = await ref.put(file);
            const url = await snapshot.ref.getDownloadURL();
            
            Logger.info('Storage', 'File uploaded', {
                path: path,
                size: file.size,
                url: url
            });
            
            return url;
        } catch (error) {
            Logger.error('Storage', 'Error uploading file', {
                path: path,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Delete file
     * @param {string} path - Storage path
     */
    delete: async function(path) {
        try {
            const storage = getStorage();
            const ref = storage.ref(path);
            await ref.delete();
            
            Logger.info('Storage', 'File deleted', {
                path: path
            });
        } catch (error) {
            Logger.error('Storage', 'Error deleting file', {
                path: path,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Get download URL
     * @param {string} path - Storage path
     * @returns {Promise<string>} Download URL
     */
    getUrl: async function(path) {
        try {
            const storage = getStorage();
            const ref = storage.ref(path);
            const url = await ref.getDownloadURL();
            
            return url;
        } catch (error) {
            Logger.error('Storage', 'Error getting file URL', {
                path: path,
                error: error.message
            });
            throw error;
        }
    }
};

// Export for global use
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
window.getFirestore = getFirestore;
window.getAuth = getAuth;
window.getStorage = getStorage;
window.Collections = Collections;
window.Database = Database;
window.Auth = Auth;
window.Storage = Storage;
