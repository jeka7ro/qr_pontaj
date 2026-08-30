const supabase = require('./supabaseClient');

async function test() {
  const fileBuffer = Buffer.from('test');
  const fileName = 'test/test.txt';
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (error) {
    console.error('Supabase upload error:', error);
  } else {
    console.log('Success:', data);
  }
}
test();
