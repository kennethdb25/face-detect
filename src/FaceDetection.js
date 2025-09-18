import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
    FACEMESH_LIPS, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW,
    FACEMESH_RIGHT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_FACE_OVAL,
    FACEMESH_NOSE
} from "@mediapipe/face_mesh";


export default function FaceDetection() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [headShape, setHeadShape] = useState("Detecting...");

    useEffect(() => {
        const faceMesh = new FaceMesh({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onResults);

        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null
        ) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    await faceMesh.send({ image: webcamRef.current.video });
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }

        function onResults(results) {
            const canvasCtx = canvasRef.current.getContext("2d");
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.drawImage(
                results.image,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];


                // Draw outlines like your example
                drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: "blue", lineWidth: 2 });
                drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: "blue", lineWidth: 2 });
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: "blue", lineWidth: 2 });
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: "blue", lineWidth: 2 });
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, { color: "blue", lineWidth: 2 });
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: "blue", lineWidth: 2 });
                drawConnectors(canvasCtx, landmarks, FACEMESH_NOSE, { color: "blue", lineWidth: 2 });

                // Draw square points instead of circles
                landmarks.forEach((lm) => {
                    const x = lm.x * canvasRef.current.width;
                    const y = lm.y * canvasRef.current.height;
                    canvasCtx.fillStyle = "blue";
                    canvasCtx.fillRect(x - 2, y - 2, 4, 4); // small square
                });

                // Detect head shape
                detectHeadShape(landmarks);
            }
            canvasCtx.restore();
        }

        function detectHeadShape(landmarks) {
            // Key points
            const forehead = landmarks[10]; // top of forehead
            const chin = landmarks[152]; // chin
            const leftCheek = landmarks[234]; // left side
            const rightCheek = landmarks[454]; // right side
            const jawLeft = landmarks[jawPointIndex(landmarks, true)];
            const jawRight = landmarks[jawPointIndex(landmarks, false)];

            // Calculate ratios
            const faceLength = distance(forehead, chin);
            const faceWidth = distance(leftCheek, rightCheek);
            const jawWidth = distance(jawLeft, jawRight);

            let shape = "Unknown";
            if (faceLength / faceWidth > 1.5) {
                shape = "Oblong";
            } else if (Math.abs(faceLength - faceWidth) < 30) {
                shape = "Round";
            } else if (jawWidth > faceWidth * 0.9) {
                shape = "Square";
            } else if (faceWidth > faceLength * 0.9) {
                shape = "Oval";
            } else {
                shape = "Heart";
            }
            setHeadShape(shape);
        }

        function distance(p1, p2) {
            return Math.sqrt(
                Math.pow(p1.x - p2.x, 2) +
                Math.pow(p1.y - p2.y, 2)
            );
        }

        function jawPointIndex(landmarks, left) {
            // crude jaw reference points
            return left ? 130 : 359;
        }
    }, []);

    return (
        <div className="flex flex-col items-center">
            <Webcam
                ref={webcamRef}
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    width: 640,
                    height: 480,
                }}
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ border: "2px solid #000" }}
            />
            <h2 className="mt-4 text-lg font-bold">
                Head Shape: {headShape}
            </h2>
        </div>
    );
}
