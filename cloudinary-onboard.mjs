import { v2 as cloudinary } from 'cloudinary';

(async function () {
  // ── Configuration ──────────────────────────────────────────────────────
  cloudinary.config({
    cloud_name: 'pkoixblg',
    api_key: '214825382457298',
    api_secret: 'E8s3uuab2rXf4FTeCV9xveU3OC0',
  });

  // ── 1. Upload an image ─────────────────────────────────────────────────
  console.log('Uploading image from Cloudinary demo...\n');

  const uploadResult = await cloudinary.uploader.upload(
    'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
    { public_id: 'shoes' }
  );

  console.log('✅ Upload successful!');
  console.log(`   Secure URL : ${uploadResult.secure_url}`);
  console.log(`   Public ID   : ${uploadResult.public_id}\n`);

  // ── 2. Get image details ───────────────────────────────────────────────
  // Fetch the uploaded resource to get its metadata
  const resource = await cloudinary.api.resource('shoes');

  console.log('📸 Image metadata:');
  console.log(`   Width      : ${resource.width}px`);
  console.log(`   Height     : ${resource.height}px`);
  console.log(`   Format     : ${resource.format}`);
  console.log(`   File size  : ${resource.bytes} bytes\n`);

  // ── 3. Generate transformed URL ────────────────────────────────────────
  // f_auto : Automatically selects the best image format (e.g. WebP, AVIF)
  //          based on the browser's capabilities, reducing file size.
  // q_auto : Automatically adjusts the compression quality to balance
  //          visual quality and file size for faster loading.
  const transformedUrl = cloudinary.url('shoes', {
    fetch_format: 'auto',
    quality: 'auto',
  });

  console.log('✨ Done! Click link below to see optimized version of the image. Check the size and the format.');
  console.log(`   ${transformedUrl}`);
})();
