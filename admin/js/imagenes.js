// ============================================
// OPTIMIZACIÓN DE IMÁGENES EN EL NAVEGADOR
// Redimensiona, convierte a WebP y comprime antes de subir a Supabase Storage.
// Así no necesitamos ningún servidor para procesar imágenes.
// ============================================

const MAX_LADO = 1200;
const CALIDAD_WEBP = 0.8;

function optimizarImagen(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen.'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > MAX_LADO || height > MAX_LADO) {
        if (width > height) {
          height = Math.round((height * MAX_LADO) / width);
          width = MAX_LADO;
        } else {
          width = Math.round((width * MAX_LADO) / height);
          height = MAX_LADO;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('No se pudo procesar la imagen.'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        CALIDAD_WEBP
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen.'));
    };

    img.src = url;
  });
}

// Sube un Blob ya optimizado al bucket "productos" y devuelve la URL pública
async function subirImagen(blob, nombreBase) {
  const nombreArchivo = `${nombreBase}-${Date.now()}.webp`;

  const { error } = await sb.storage
    .from('productos')
    .upload(nombreArchivo, blob, {
      contentType: 'image/webp',
      upsert: false
    });

  if (error) throw error;

  const { data } = sb.storage.from('productos').getPublicUrl(nombreArchivo);
  return data.publicUrl;
}
