// Simple in-memory cache for audio data
// In production, this would be replaced with proper storage (S3, Supabase Storage, etc.)

import fs from 'fs';
import path from 'path';

interface AudioCache {
  [scriptId: string]: ArrayBuffer;
}

const audioCache: AudioCache = {};

// Create audio directory if it doesn't exist
const audioDir = path.join(process.cwd(), 'public', 'generated-audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log(`📁 Created audio directory: ${audioDir}`);
}

// Add global debugging
console.log('🏗️ Audio cache module loaded at:', new Date().toISOString());
console.log(`📁 Audio files will be saved to: ${audioDir}`);

export function storeAudioBuffer(scriptId: string, audioBuffer: ArrayBuffer): void {
  console.log(`🔄 Attempting to store audio buffer for script ${scriptId}`);
  console.log(`📊 Audio buffer details:`, {
    scriptId,
    bufferSize: audioBuffer.byteLength,
    bufferType: typeof audioBuffer,
    isArrayBuffer: audioBuffer instanceof ArrayBuffer
  });
  
  // Store in memory cache
  audioCache[scriptId] = audioBuffer;
  console.log(`🗄️ Successfully stored audio buffer in memory for script ${scriptId}, size: ${audioBuffer.byteLength} bytes`);
  console.log(`📋 Current cache keys:`, Object.keys(audioCache));
  
  // Also save to disk for verification
  try {
    const audioFilePath = path.join(audioDir, `${scriptId}.mp3`);
    const buffer = new Uint8Array(audioBuffer);
    fs.writeFileSync(audioFilePath, buffer);
    console.log(`💾 Audio file saved to disk: ${audioFilePath}`);
    console.log(`📁 File size on disk: ${fs.statSync(audioFilePath).size} bytes`);
    
    // List all files in the directory for verification
    const files = fs.readdirSync(audioDir);
    console.log(`📂 All audio files in directory:`, files);
  } catch (error) {
    console.error(`❌ Failed to save audio file to disk:`, error);
  }
}

export function getAudioBuffer(scriptId: string): ArrayBuffer | null {
  console.log(`🔍 Attempting to retrieve audio buffer for script ${scriptId}`);
  console.log(`📋 Available cache keys:`, Object.keys(audioCache));
  console.log(`📊 Cache details:`, Object.keys(audioCache).map(key => ({
    key,
    size: audioCache[key]?.byteLength || 0
  })));
  
  const buffer = audioCache[scriptId];
  if (buffer) {
    console.log(`📦 Retrieved audio buffer from memory for script ${scriptId}, size: ${buffer.byteLength} bytes`);
    return buffer;
  } else {
    console.log(`❌ No audio buffer found in memory for script ${scriptId}`);
    console.log(`🔍 Exact match check:`, Object.keys(audioCache).includes(scriptId));
    console.log(`🔍 Cache is empty:`, Object.keys(audioCache).length === 0);
    
    // Try to read from disk as fallback
    try {
      const audioFilePath = path.join(audioDir, `${scriptId}.mp3`);
      if (fs.existsSync(audioFilePath)) {
        console.log(`💿 Found audio file on disk, reading: ${audioFilePath}`);
        const fileBuffer = fs.readFileSync(audioFilePath);
        const arrayBuffer = new ArrayBuffer(fileBuffer.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        uint8Array.set(fileBuffer);
        console.log(`📦 Retrieved audio buffer from disk for script ${scriptId}, size: ${arrayBuffer.byteLength} bytes`);
        
        // Store back in memory cache for next time
        audioCache[scriptId] = arrayBuffer;
        console.log(`🔄 Restored to memory cache from disk`);
        
        return arrayBuffer;
      } else {
        console.log(`💿 No audio file found on disk at: ${audioFilePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to read audio file from disk:`, error);
    }
  }
  
  return null;
}

export function clearAudioBuffer(scriptId: string): void {
  delete audioCache[scriptId];
  console.log(`🗑️ Cleared audio buffer for script ${scriptId}`);
}

// Clean up old entries (optional, for memory management)
export function cleanupOldAudio(): void {
  // In a real implementation, you'd track timestamps and clean up old entries
  console.log('🧹 Audio cache cleanup (not implemented yet)');
}
