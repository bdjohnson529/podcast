import { supabase, createServerClient } from './supabase';

const AUDIO_BUCKET = 'podcast-audio';

export class SupabaseAudioStorage {
  
  /**
   * Upload audio buffer to Supabase Storage
   */
  static async uploadAudio(
    scriptId: string, 
    audioBuffer: ArrayBuffer, 
    userId?: string
  ): Promise<{ publicUrl: string; path: string } | null> {
    try {
      console.log(`📤 Uploading audio to Supabase Storage for script ${scriptId}`);
      console.log(`🔑 Upload context: userId=${userId}, bufferSize=${audioBuffer.byteLength}`);
      
      // Create file path with user folder structure if authenticated
      const fileName = `${scriptId}.mp3`;
      const filePath = userId ? `users/${userId}/${fileName}` : `anonymous/${fileName}`;
      
      console.log(`📁 Upload path: ${filePath}`);
      
      // Convert ArrayBuffer to Uint8Array for upload
      const audioData = new Uint8Array(audioBuffer);
      
      // Use server client for storage operations (has service role permissions)
      const serverClient = createServerClient();
      
      // Upload to Supabase Storage
      console.log(`⬆️ Starting upload to bucket: ${AUDIO_BUCKET}`);
      const { data, error } = await serverClient.storage
        .from(AUDIO_BUCKET)
        .upload(filePath, audioData, {
          contentType: 'audio/mpeg',
          upsert: true // Replace existing file if it exists
        });
      
      if (error) {
        console.error('❌ Supabase Storage upload error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          error: error
        });
        return null;
      }
      
      console.log('✅ Audio uploaded successfully:', data.path);
      
      // Get public URL
      const { data: { publicUrl } } = serverClient.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(filePath);
      
      console.log('🔗 Public URL generated:', publicUrl);
      
      return {
        publicUrl,
        path: filePath
      };
      
    } catch (error) {
      console.error('💥 Audio upload failed:', error);
      return null;
    }
  }
  
  /**
   * Copy audio file from script ID to episode ID
   */
  static async copyAudio(
    sourceScriptId: string,
    targetEpisodeId: string,
    userId: string
  ): Promise<{ publicUrl: string; path: string } | null> {
    try {
      console.log(`📁 Copying audio from ${sourceScriptId} to ${targetEpisodeId}`);
      
      // Define source and target paths
      const sourceFileName = `${sourceScriptId}.mp3`;
      const targetFileName = `${targetEpisodeId}.mp3`;
      const sourcePath = `users/${userId}/${sourceFileName}`;
      const targetPath = `users/${userId}/${targetFileName}`;
      
      console.log('📊 Copy paths:', { sourcePath, targetPath });
      
      // Use server client for admin operations
      const serverSupabase = createServerClient();
      
      // Download the source file
      const { data: sourceData, error: downloadError } = await serverSupabase.storage
        .from(AUDIO_BUCKET)
        .download(sourcePath);
      
      if (downloadError) {
        console.error('❌ Download error:', downloadError);
        return null;
      }
      
      console.log('✅ Source file downloaded, size:', sourceData.size);
      
      // Upload to new location
      const { data: uploadData, error: uploadError } = await serverSupabase.storage
        .from(AUDIO_BUCKET)
        .upload(targetPath, sourceData, {
          contentType: 'audio/mpeg',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return null;
      }
      
      console.log('✅ Audio copied successfully:', uploadData.path);
      
      // Get public URL for the new file
      const { data: { publicUrl } } = serverSupabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(targetPath);
      
      return {
        publicUrl,
        path: targetPath
      };
      
    } catch (error) {
      console.error('💥 Audio copy failed:', error);
      return null;
    }
  }

  /**
   * Delete audio file from Supabase Storage
   */
  static async deleteAudio(filePath: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting audio file: ${filePath}`);
      
      // Use server client for storage operations
      const serverClient = createServerClient();
      
      const { error } = await serverClient.storage
        .from(AUDIO_BUCKET)
        .remove([filePath]);
      
      if (error) {
        console.error('❌ Audio deletion error:', error);
        return false;
      }
      
      console.log('✅ Audio deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('💥 Audio deletion failed:', error);
      return false;
    }
  }
  
  /**
   * List audio files for a user
   */
  static async listUserAudio(userId: string): Promise<string[]> {
    try {
      // Use server client for storage operations
      const serverClient = createServerClient();
      
      const { data, error } = await serverClient.storage
        .from(AUDIO_BUCKET)
        .list(`users/${userId}`);
      
      if (error) {
        console.error('❌ Audio listing error:', error);
        return [];
      }
      
      return data?.map(file => file.name) || [];
    } catch (error) {
      console.error('💥 Audio listing failed:', error);
      return [];
    }
  }
  
  /**
   * Ensure the audio bucket exists
   */
  static async initializeBucket(): Promise<boolean> {
    try {
      console.log('🔍 Checking existing buckets...');
      
      // Use server client for admin operations
      const serverSupabase = createServerClient();
      
      // First try to get bucket info to see if it exists
      const { data: buckets, error: listError } = await serverSupabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Failed to list buckets:', listError);
        return false;
      }
      
      console.log('📋 Existing buckets:', buckets?.map(b => b.name) || []);
      const bucketExists = buckets?.some(bucket => bucket.name === AUDIO_BUCKET);
      
      if (!bucketExists) {
        console.log('📦 Creating podcast-audio bucket...');
        
        const { error: createError } = await serverSupabase.storage.createBucket(AUDIO_BUCKET, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav']
        });
        
        if (createError) {
          console.error('❌ Bucket creation error:', createError);
          console.error('❌ Error details:', {
            message: createError.message,
            details: createError
          });
          return false;
        }
        
        console.log('✅ Bucket created successfully');
      } else {
        console.log('✅ Audio bucket already exists');
      }
      
      return true;
    } catch (error) {
      console.error('💥 Bucket initialization failed:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      return false;
    }
  }
}
