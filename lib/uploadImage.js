import { supabase } from './supabase'

export async function uploadImage(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('pepepipi-assets')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage
    .from('pepepipi-assets')
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}
