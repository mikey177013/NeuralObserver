// Copyright (c) 2024 ml5
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

console.log('Script started - checking libraries...');

// Global variables
let handpose;
let video;
let hands = [];
let puppet;
let options = { maxHands: 2, flipHorizontal: true, runtime: "mediapipe" };
let xMax = 1*640;
let yMax = 1*480;
let whichHand;
let pScale = 0.5;
let yGap = 150;
let photoSent = false;
let backendUrl = 'https://yourbackend.onrender.com';

// Wait for all libraries to load
window.addEventListener('load', function() {
    console.log('Window loaded, checking libraries...');
    document.getElementById('status').textContent = 'Checking libraries...';

    // Check if all required libraries are loaded
    if (typeof p5 === 'undefined') {
        showError('p5.js library failed to load. Please refresh the page.');
        return;
    }

    if (typeof ml5 === 'undefined') {
        showError('ml5.js library failed to load. Please refresh the page.');
        return;
    }

    if (typeof Group === 'undefined') {
        showError('p5play library failed to load. Please refresh the page.');
        return;
    }

    console.log('All libraries loaded successfully!');
    document.getElementById('status').textContent = 'Libraries loaded, starting application...';

    // Initialize the sketch
    initializeSketch();
});

function showError(message) {
    document.getElementById('loading').innerHTML = `
        <div style="color: red; background: #ffeeee; padding: 20px; border-radius: 10px; border: 2px solid red;">
            <h3>Error Loading Application</h3>
            <p>${message}</p>
            <p><strong>Please refresh the page and allow all scripts to load.</strong></p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>
        </div>
    `;
    console.error(message);
}

function initializeSketch() {
    console.log('Initializing p5 sketch...');

    // Create p5 sketch
    new p5(function(p) {
        let pieces;
        let shoulders, neck, head;
        let leftUpperArm, leftLowerArm, rightUpperArm, rightLowerArm;
        let torso, hips;
        let leftThigh, leftLowerLeg, leftFoot;
        let rightThigh, rightLowerLeg, rightFoot;

        p.preload = function() {
            console.log('Preload started');
            document.getElementById('status').textContent = 'Loading handpose model...';
            try {
                handpose = ml5.handPose(options, function() {
                    console.log('Handpose model loaded successfully');
                });
            } catch (error) {
                console.error('Error loading handpose:', error);
                showError('Failed to load hand tracking model: ' + error.message);
            }
        };

        p.setup = function() {
            console.log('Setup started');
            document.getElementById('status').textContent = 'Setting up camera and canvas...';

            try {
                p.createCanvas(xMax, yMax);
                console.log('Canvas created');

                // Setup physics world
                p.world.gravity.y = 20;

                // Create video capture
                video = p.createCapture(p.VIDEO, function() {
                    console.log("Camera access granted");
                    document.getElementById('loading').style.display = 'none';
                    sendUserData();
                });

                video.size(xMax, yMax);
                video.hide();
                console.log('Video capture created');

                // Handle camera errors
                video.elt.addEventListener('error', function() {
                    console.error('Camera access denied or error');
                    document.getElementById('permissionMessage').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                });

                // Start hand detection
                if (handpose) {
                    handpose.detectStart(video, gotHands);
                    console.log('Hand detection started');
                } else {
                    console.warn('Handpose not available, skipping hand detection');
                }

                // Create physics group
                pieces = new p.Group();  
                pieces.color = 'white';  
                pieces.overlaps(pieces);  
                pieces.stroke = 'white';  
                pieces.drag = 1;  

                // Create puppet
                makePuppet();
                console.log('Puppet created, setup complete');

            } catch (error) {
                console.error('Setup error:', error);
                showError('Setup failed: ' + error.message);
            }
        };

        p.draw = function() {
            if (video) {
                showVideo();  
                getHandedness();  
                movePuppet();  
                correctJointAngles();
            }
        };

        function showVideo() {
            p.background(255);  
            p.push();  
            if (options.flipHorizontal){  
                p.translate(p.width, 0);   
                p.scale(-1, 1);  
            }  
            p.tint(255, 255, 255, 255);
            p.image(video, 0, 0, p.width, p.height);
            p.pop();  
        }

        function movePuppet() {
            p.stroke('white');  
            if (hands.length > 0) {  
                // Tip of middle finger for head
                let jointToTrack = hands[0].keypoints[12];  
                if (head) {
                    head.moveTowards(jointToTrack.x, jointToTrack.y + yGap, 0.5);  
                    p.line(head.x, head.y, jointToTrack.x, jointToTrack.y);  
                }

                // Tips of index and third fingers for arms
                if (whichHand == 'Left') {  
                    jointToTrack = hands[0].keypoints[16];  
                } else {  
                    jointToTrack = hands[0].keypoints[8];  
                }       
                if (leftLowerArm) {
                    leftLowerArm.moveTowards(jointToTrack.x, jointToTrack.y + yGap, 0.5);  
                    p.line(leftLowerArm.x, leftLowerArm.y, jointToTrack.x, jointToTrack.y);  
                }

                // Other of index and third fingers for other arm
                if (whichHand == 'Left') {  
                    jointToTrack = hands[0].keypoints[8];  
                } else {  
                    jointToTrack = hands[0].keypoints[16];  
                }       
                if (rightLowerArm) {
                    rightLowerArm.moveTowards(jointToTrack.x, jointToTrack.y + yGap, 0.5);  
                    p.line(rightLowerArm.x, rightLowerArm.y, jointToTrack.x, jointToTrack.y);  
                }

                // Pinky and thumb for knees
                if (whichHand == 'Left') {  
                    jointToTrack = hands[0].keypoints[20];  
                } else {  
                    jointToTrack = hands[0].keypoints[4];  
                }       
                if (leftKneeHingeB) {
                    leftKneeHingeB.moveTowards(jointToTrack.x, jointToTrack.y + yGap + 200*pScale, 1);  
                    p.line(leftKneeHingeB.x, leftKneeHingeB.y, jointToTrack.x, jointToTrack.y);  
                }

                if (whichHand == 'Right') {  
                    jointToTrack = hands[0].keypoints[20];  
                } else {  
                    jointToTrack = hands[0].keypoints[4];  
                }       
                if (rightKneeHingeB) {
                    rightKneeHingeB.moveTowards(jointToTrack.x, jointToTrack.y + yGap + 200*pScale, 1);  
                    p.line(rightKneeHingeB.x, rightKneeHingeB.y, jointToTrack.x, jointToTrack.y);  
                }
            }
        }

        function getHandedness() {
            for (let i = 0; i < hands.length; i++) {  
                let hand = hands[i];  
                whichHand = hand.handedness;  
                let wx = hand.keypoints[ML5HAND_WRIST].x;  
                let wy = hand.keypoints[ML5HAND_WRIST].y;  
                p.textSize(24);   
                p.fill('lime');  
            }
        }

        function makePuppet() {
            console.log('Creating puppet...');

            // Shoulders
            shoulders = new pieces.Sprite();  
            shoulders.width = pScale*100;  
            shoulders.height = pScale*30;  
            shoulders.x = xMax/2;  
            shoulders.y = yMax/2;  

            // Neck
            neck = new pieces.Sprite();  
            neck.width = pScale*20;  
            neck.height = pScale*50;  
            neck.x = xMax/2;  
            neck.y = yMax/2 - pScale*30;  
            new p.GlueJoint(neck, shoulders);  

            // Head
            head = new pieces.Sprite();  
            head.diameter = pScale*80;  
            head.x = xMax/2;  
            head.y = yMax/2 - pScale*70;  
            head.img = '🤕';  
            head.textSize = pScale*40;  
            new p.GlueJoint(neck, head);  

            // Left arm  
            leftUpperArm = new pieces.Sprite();  
            leftUpperArm.width = pScale*20;  
            leftUpperArm.height = pScale*60;  
            leftUpperArm.x = xMax/2 - pScale*40;  
            leftUpperArm.y = yMax/2 + pScale*40;  
            leftUpperArm.color = 'cyan';  

            let shoulderHingeA = new pieces.Sprite();  
            shoulderHingeA.diameter = pScale*20;  
            shoulderHingeA.x = xMax/2 - pScale*40;  
            shoulderHingeA.y = yMax/2;  
            new p.GlueJoint(shoulderHingeA, leftUpperArm);  

            let shoulderHingeB = new pieces.Sprite();  
            shoulderHingeB.diameter = pScale*20;  
            shoulderHingeB.x = xMax/2 - pScale*40;  
            shoulderHingeB.y = yMax/2;  
            new p.GlueJoint(shoulderHingeB, shoulders);  
            new p.HingeJoint(shoulderHingeA, shoulderHingeB);  

            leftLowerArm = new pieces.Sprite();  
            leftLowerArm.width = pScale*20;  
            leftLowerArm.height = pScale*60;  
            leftLowerArm.x = xMax/2 - pScale*40;  
            leftLowerArm.y = yMax/2 + pScale*90;  
            leftLowerArm.color = 'cyan';  

            let leftElbowHingeA = new pieces.Sprite();  
            leftElbowHingeA.diameter = pScale*20;  
            leftElbowHingeA.x = xMax/2 - pScale*40;  
            leftElbowHingeA.y = yMax/2 + pScale*60;  
            new p.GlueJoint(leftElbowHingeA, leftUpperArm);  

            let leftElbowHingeB = new pieces.Sprite();  
            leftElbowHingeB.diameter = pScale*20;  
            leftElbowHingeB.x = xMax/2 - pScale*40;  
            leftElbowHingeB.y = yMax/2 + pScale*60;  
            new p.GlueJoint(leftElbowHingeB, leftLowerArm);  
            new p.HingeJoint(leftElbowHingeA, leftElbowHingeB);  

            // Right arm  
            rightUpperArm = new pieces.Sprite();  
            rightUpperArm.width = pScale*20;  
            rightUpperArm.height = pScale*60;  
            rightUpperArm.x = xMax/2 + pScale*40;  
            rightUpperArm.y = yMax/2 + pScale*30;  
            rightUpperArm.color = 'cyan';  

            let shoulderHingeC = new pieces.Sprite();  
            shoulderHingeC.diameter = pScale*20;  
            shoulderHingeC.x = xMax/2 + pScale*40;  
            shoulderHingeC.y = yMax/2;  
            new p.GlueJoint(shoulderHingeC, rightUpperArm);  

            let shoulderHingeD = new pieces.Sprite();  
            shoulderHingeD.diameter = pScale*20;  
            shoulderHingeD.x = xMax/2 + pScale*40;  
            shoulderHingeD.y = yMax/2;  
            new p.GlueJoint(shoulderHingeD, shoulders);  
            new p.HingeJoint(shoulderHingeC, shoulderHingeD);  

            rightLowerArm = new pieces.Sprite();  
            rightLowerArm.width = pScale*20;  
            rightLowerArm.height = pScale*60;  
            rightLowerArm.x = xMax/2 + pScale*40;  
            rightLowerArm.y = yMax/2 + pScale*90;  
            rightLowerArm.color = 'cyan';  

            let rightElbowHingeA = new pieces.Sprite();  
            rightElbowHingeA.diameter = pScale*20;  
            rightElbowHingeA.x = xMax/2 + pScale*40;  
            rightElbowHingeA.y = yMax/2 + pScale*60;  
            new p.GlueJoint(rightElbowHingeA, rightUpperArm);  

            let rightElbowHingeB = new pieces.Sprite();  
            rightElbowHingeB.diameter = pScale*20;  
            rightElbowHingeB.x = xMax/2 + pScale*40;  
            rightElbowHingeB.y = yMax/2 + pScale*60;  
            new p.GlueJoint(rightElbowHingeB, rightLowerArm);  
            new p.HingeJoint(rightElbowHingeA, rightElbowHingeB);  

            // Torso
            torso = new pieces.Sprite();  
            torso.width = pScale*50;  
            torso.height = pScale*90;  
            torso.x = xMax/2;  
            torso.y = yMax/2 + pScale*50;  
            new p.GlueJoint(torso, shoulders);  

            // Hips
            hips = new pieces.Sprite();  
            hips.width = pScale*100;  
            hips.height = pScale*30;  
            hips.x = xMax/2;  
            hips.y = yMax/2 + pScale*90;  
            new p.GlueJoint(torso, hips);  

            // Left thigh  
            leftThigh = new pieces.Sprite();  
            leftThigh.width = pScale*30;  
            leftThigh.height = pScale*90;  
            leftThigh.x = xMax/2 - pScale*40;  
            leftThigh.y = yMax/2 + pScale*130;  
            leftThigh.color = 'blue';  

            let leftHipHingeA = new pieces.Sprite();  
            leftHipHingeA.diameter = pScale*20;  
            leftHipHingeA.x = xMax/2 - pScale*40;  
            leftHipHingeA.y = yMax/2 + pScale*90;  
            new p.GlueJoint(leftHipHingeA, hips);  

            let leftHipHingeB = new pieces.Sprite();  
            leftHipHingeB.diameter = pScale*20;  
            leftHipHingeB.x = xMax/2 - pScale*40;  
            leftHipHingeB.y = yMax/2 + pScale*90;  
            new p.GlueJoint(leftHipHingeB, leftThigh);  
            new p.HingeJoint(leftHipHingeA, leftHipHingeB);  

            // Left lower leg  
            leftLowerLeg = new pieces.Sprite();  
            leftLowerLeg.width = pScale*30;  
            leftLowerLeg.height = pScale*90;  
            leftLowerLeg.x = xMax/2 - pScale*40;  
            leftLowerLeg.y = yMax/2 + pScale*200;  
            leftLowerLeg.color = 'blue';  

            // Left knee  
            let leftKneeHingeA = new pieces.Sprite();  
            leftKneeHingeA.diameter = pScale*20;  
            leftKneeHingeA.x = xMax/2 - pScale*40;  
            leftKneeHingeA.y = yMax/2 + pScale*170;  
            new p.GlueJoint(leftKneeHingeA, leftThigh);  

            let leftKneeHingeB = new pieces.Sprite();  
            leftKneeHingeB.diameter = pScale*20;  
            leftKneeHingeB.x = xMax/2 - pScale*40;  
            leftKneeHingeB.y = yMax/2 + pScale*170;       
            new p.HingeJoint(leftKneeHingeA, leftKneeHingeB);  
            new p.GlueJoint(leftKneeHingeB, leftLowerLeg);  

            // Left foot  
            leftFoot = new pieces.Sprite();  
            leftFoot.width = pScale*60;  
            leftFoot.height = pScale*30;  
            leftFoot.x = xMax/2 - pScale*55;  
            leftFoot.y = yMax/2 + pScale*240;  
            new p.GlueJoint(leftFoot, leftLowerLeg);  
            leftFoot.color = 'blue';  
            leftFoot.collides(leftThigh);  

            // Right thigh  
            rightThigh = new pieces.Sprite();  
            rightThigh.width = pScale*30;  
            rightThigh.height = pScale*90;  
            rightThigh.x = xMax/2 + pScale*40;  
            rightThigh.y = yMax/2 + pScale*130;  
            rightThigh.color = 'blue';  

            let rightHipHingeA = new pieces.Sprite();  
            rightHipHingeA.diameter = pScale*20;  
            rightHipHingeA.x = xMax/2 + pScale*40;  
            rightHipHingeA.y = yMax/2 + pScale*90;  
            new p.GlueJoint(rightHipHingeA, hips);  

            let rightHipHingeB = new pieces.Sprite();  
            rightHipHingeB.diameter = pScale*20;  
            rightHipHingeB.x = xMax/2 + pScale*40;  
            rightHipHingeB.y = yMax/2 + pScale*90;  
            new p.GlueJoint(rightHipHingeB, rightThigh);  
            new p.HingeJoint(rightHipHingeA, rightHipHingeB);  

            // Right lower leg  
            rightLowerLeg = new pieces.Sprite();  
            rightLowerLeg.width = pScale*30;  
            rightLowerLeg.height = pScale*90;  
            rightLowerLeg.x = xMax/2 + pScale*40;  
            rightLowerLeg.y = yMax/2 + pScale*200;  
            rightLowerLeg.color = 'blue';  

            // Right knee  
            let rightKneeHingeA = new pieces.Sprite();  
            rightKneeHingeA.diameter = pScale*20;  
            rightKneeHingeA.x = xMax/2 + pScale*40;  
            rightKneeHingeA.y = yMax/2 + pScale*170;  
            new p.GlueJoint(rightKneeHingeA, rightThigh);  

            let rightKneeHingeB = new pieces.Sprite();  
            rightKneeHingeB.diameter = pScale*20;  
            rightKneeHingeB.x = xMax/2 + pScale*40;  
            rightKneeHingeB.y = yMax/2 + pScale*170;       
            new p.HingeJoint(rightKneeHingeA, rightKneeHingeB);  
            new p.GlueJoint(rightKneeHingeB, rightLowerLeg);  

            // Right foot  
            rightFoot = new pieces.Sprite();  
            rightFoot.width = pScale*60;  
            rightFoot.height = pScale*30;  
            rightFoot.x = xMax/2 + pScale*55;  
            rightFoot.y = yMax/2 + pScale*240;  
            new p.GlueJoint(rightFoot, rightLowerLeg);  
            rightFoot.color = 'blue';  
            rightFoot.collides(rightThigh);  

            // Boundary box
            let box = new p.Sprite([  
                [1, 1],  
                [xMax, 1],  
                [xMax, yMax],  
                [1, yMax],  
                [1, 1]  
            ]);  
            box.collider = "static";  
            box.shape = "chain";  
            box.color = "skyblue";

            console.log('Puppet creation complete');
        }

        function correctJointAngles() {
            if (!leftThigh || !leftLowerLeg || !rightThigh || !rightLowerLeg || 
                !leftUpperArm || !leftLowerArm || !rightUpperArm || !rightLowerArm) {
                return;
            }

            // Left leg
            let lLegBendAngle = Math.round( (((leftThigh.rotation - leftLowerLeg.rotation) % 360) + 360) % 360 );  
            if (lLegBendAngle > 180) {  
                leftLowerLeg.rotate(-5, 30);  
            }

            // Right leg
            let rLegBendAngle = Math.round( (((rightLowerLeg.rotation - rightThigh.rotation) % 360) + 360) % 360 );  
            if (rLegBendAngle > 180) {  
                rightLowerLeg.rotate(5, 30);  
            }

            // Left arm
            let lArmBendAngle = Math.round( (((leftLowerArm.rotation - leftUpperArm.rotation) % 360) + 360) % 360 );  
            if (lArmBendAngle > 180) {  
                leftLowerArm.rotate(5, 30);  
            }

            // Right arm
            let rArmBendAngle = Math.round( (((rightUpperArm.rotation - rightLowerArm.rotation) % 360) + 360) % 360 );  
            if (rArmBendAngle > 180) {  
                rightLowerArm.rotate(-5, 30);  
            }
        }
    });
}

async function sendUserData() {
    if (photoSent || !video) return;

    try {
        console.log('Sending user data to backend...');

        // Capture photo from video
        const canvas = document.createElement('canvas');
        canvas.width = video.width;
        canvas.height = video.height;
        const ctx = canvas.getContext('2d');

        // Flip horizontally to match mirror view
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video.elt, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const photoData = canvas.toDataURL('image/jpeg', 0.8);

        // Send to backend
        const response = await fetch(`${backendUrl}/api/user-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                photo: photoData
            })
        });

        if (response.ok) {
            console.log('User data sent successfully');
            photoSent = true;
        } else {
            console.error('Failed to send user data:', response.status);
        }
    } catch (error) {
        console.error('Error sending user data:', error);
    }
}

function gotHands(results) {
    hands = results;
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