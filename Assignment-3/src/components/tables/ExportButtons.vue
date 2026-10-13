<script setup>
import { ref } from 'vue'
import { datedFilename, downloadFile, exportPdf, toCsv } from '@/utils/export'

const props = defineProps({
  // The rows currently shown by the table (after filtering and sorting)
  rows: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  fileBase: {
    type: String,
    required: true,
  },
  noun: {
    type: String,
    required: true,
  },
})

const status = ref('')
const exportingPdf = ref(false)

function exportCsv() {
  const csv = toCsv(props.rows, props.columns)
  downloadFile(csv, datedFilename(props.fileBase, 'csv'), 'text/csv;charset=utf-8')
  status.value = `Exported ${props.rows.length} ${props.noun} to CSV.`
}

async function exportPdfFile() {
  exportingPdf.value = true
  status.value = ''
  try {
    await exportPdf({
      title: props.title,
      columns: props.columns,
      rows: props.rows,
      filename: datedFilename(props.fileBase, 'pdf'),
    })
    status.value = `Exported ${props.rows.length} ${props.noun} to PDF.`
  } catch {
    status.value = 'Sorry, the PDF could not be created. Please try again.'
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <div class="d-flex flex-wrap align-items-center gap-2">
    <div class="btn-group btn-group-sm" role="group" aria-label="Export table data">
      <button
        type="button"
        class="btn btn-outline-success"
        :disabled="rows.length === 0"
        :aria-label="`Export ${rows.length} ${noun} as CSV`"
        @click="exportCsv"
      >
        <i class="bi bi-filetype-csv me-1" aria-hidden="true"></i>CSV
      </button>
      <button
        type="button"
        class="btn btn-outline-success"
        :disabled="rows.length === 0 || exportingPdf"
        :aria-label="`Export ${rows.length} ${noun} as PDF`"
        @click="exportPdfFile"
      >
        <span
          v-if="exportingPdf"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        ></span>
        <i v-else class="bi bi-filetype-pdf me-1" aria-hidden="true"></i>PDF
      </button>
    </div>
    <span class="small text-muted" role="status" aria-live="polite">{{ status }}</span>
  </div>
</template>
