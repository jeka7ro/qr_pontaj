const supabase = require('./supabaseClient');

async function test() {
  const fileBuffer = Buffer.from('test2');
  const fileName = 'test/test2.txt';
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, {
      contentType: 'text/plain',
      upsert: false
    });
    
  if (error) {
    console.error('Supabase upload error:', error);
  } else {
    console.log('Success:', data);
  }
}
test();
