// Same limits as the sendEmail and sendBulkEmail Cloud Functions, which check them again on the server
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
export const ATTACHMENT_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.ics,application/pdf,image/png,image/jpeg,text/calendar'
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'ics']

export function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Returns a message for the user, or '' when the file can be attached
export function attachmentError(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Please choose a PDF, PNG, JPG or ICS file.'
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `This file is ${formatSize(file.size)}. Attachments must be smaller than 2 MB.`
  }
  return ''
}

export function readAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
