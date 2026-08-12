import cv2
import os

def extract_frames(video_path, output_folder, sample_rate=1):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Directory created: {output_folder}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path}")
        return

    frame_count = 0
    saved_count = 0
    
    print("Starting watch frame extraction... Please wait.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % sample_rate == 0:
            frame_name = f"frame_{saved_count:04d}.jpg"
            save_path = os.path.join(output_folder, frame_name)
            cv2.imwrite(save_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            saved_count += 1
            
        frame_count += 1

    cap.release()
    print(f"Success! Extracted {saved_count} frames to {output_folder}")

if __name__ == "__main__":
    VIDEO = "assets/WatchRun.mp4"
    OUTPUT = "frames"
    extract_frames(VIDEO, OUTPUT, sample_rate=1)
