const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Execute SQL query with Supabase
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 */
const query = async (sqlQuery, params = []) => {
  try {
    // สำหรับ Supabase ใช้ RPC หรือ REST API
    // ตัวอย่างนี้ใช้ raw SQL ผ่าน rpc
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sqlQuery,
      params: params
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
};

/**
 * Query builder style (ใช้ Supabase query builder)
 */
const from = (table) => {
  return supabase.from(table);
};

/**
 * Upload file to Supabase Storage
 */
const uploadFile = async (bucket, path, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Get public URL for uploaded file
 */
const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Delete file from storage
 */
const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  query,
  from,
  uploadFile,
  getPublicUrl,
  deleteFile
};
