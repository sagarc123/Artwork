import { Download } from 'lucide-react'

/** Above the newsletter list: the whole list as a spreadsheet file (owner only: the file route checks again). */
export function CsvLink() {
  return (
    <p>
      <a href="/api/newsletter/export" className="today__add-btn" download>
        <Download size={22} aria-hidden="true" /> Download the list (CSV)
      </a>
    </p>
  )
}
