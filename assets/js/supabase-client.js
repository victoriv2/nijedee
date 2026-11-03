/**
 * NIJEDEE - Supabase Dual Dispatch & Client Integration
 * Handles asynchronous recording of requests, file/image uploads to Supabase Storage,
 * and real-time synchronization between website customer actions and Admin Dashboard.
 */

const NIJEDEE_SUPABASE_URL = 'https://xgdwxuraupeztihfugxb.supabase.co';
const NIJEDEE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHd4dXJhdXBlenRpaGZ1Z3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MDM1NDAsImV4cCI6MjEwOTI3OTU0MH0.0caOjkT0es74sh2qs9bx-y2jX8DIsM0MH1ZOflW4irk';

// Global client instance
let _sbClient = null;

function getNijedeeSupabase() {
  if (_sbClient) return _sbClient;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    _sbClient = window.supabase.createClient(NIJEDEE_SUPABASE_URL, NIJEDEE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return _sbClient;
  }
  return null;
}

/**
 * Uploads a file (or list of files) to the Supabase 'request-attachments' bucket.
 * Returns an array of public URLs.
 */
async function uploadRequestFiles(files, folder = 'general') {
  if (!files) return [];
  const sb = getNijedeeSupabase();
  if (!sb) return [];

  const fileList = files instanceof FileList ? Array.from(files) : (Array.isArray(files) ? files : [files]);
  const validFiles = fileList.filter(f => f && f.name && f.size > 0);
  if (!validFiles.length) return [];

  const uploadedUrls = [];

  for (const file of validFiles) {
    try {
      const ext = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedName}`;

      const { data, error } = await sb.storage
        .from('request-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Storage upload error for file', file.name, error);
        continue;
      }

      const { data: pubData } = sb.storage
        .from('request-attachments')
        .getPublicUrl(data.path);

      if (pubData && pubData.publicUrl) {
        uploadedUrls.push(pubData.publicUrl);
      }
    } catch (err) {
      console.warn('Failed to upload attachment:', err);
    }
  }

  return uploadedUrls;
}

/**
 * Records any customer request in the Supabase 'requests' table.
 * Designed to be completely resilient and non-blocking for WhatsApp redirection.
 */
async function submitNijedeeRequest(requestData) {
  try {
    const sb = getNijedeeSupabase();
    if (!sb) {
      console.warn('Supabase client not loaded, proceeding via direct WhatsApp');
      return { success: false, reason: 'client_unavailable' };
    }

    let imageUrls = Array.isArray(requestData.images) ? [...requestData.images] : [];

    // Handle files if provided
    if (requestData.files) {
      const uploaded = await uploadRequestFiles(requestData.files, requestData.type || 'requests');
      imageUrls = imageUrls.concat(uploaded);
    }

    const payload = {
      ref_code: requestData.ref_code || null,
      type: requestData.type || 'general_inquiry',
      title: requestData.title || 'Service Request',
      client_name: requestData.client_name || 'Anonymous Client',
      client_phone: requestData.client_phone || null,
      client_whatsapp: requestData.client_whatsapp || requestData.client_phone || null,
      client_email: requestData.client_email || null,
      location: requestData.location || null,
      address: requestData.address || null,
      urgency: requestData.urgency || 'Normal',
      status: 'new',
      details: requestData.details || {},
      notes: '',
      images: imageUrls,
      is_read: false
    };

    const { data, error } = await sb
      .from('requests')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase request record error:', error);
      return { success: false, error };
    }

    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.error('submitNijedeeRequest caught exception:', err);
    return { success: false, error: err };
  }
}

// Attach to window
window.NIJEDEE_SUPABASE_URL = NIJEDEE_SUPABASE_URL;
window.NIJEDEE_SUPABASE_ANON_KEY = NIJEDEE_SUPABASE_ANON_KEY;
window.getNijedeeSupabase = getNijedeeSupabase;
window.uploadRequestFiles = uploadRequestFiles;
window.submitNijedeeRequest = submitNijedeeRequest;
