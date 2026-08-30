const supabase = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

async function test() {
  const filePath = path.join(__dirname, '../frontend/src/assets/logo.png'); // assuming there's a logo or something
  // Just create a dummy png
  const dummyPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
  const fileName = 'avatars/dummy.png';
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, dummyPng, {
      contentType: 'image/png',
      upsert: false
    });
    
  if (error) {
    console.error('Supabase upload error:', error);
  } else {
    console.log('Success:', data);
  }
}
test();
