import type { AdminViewServerProps } from 'payload'
import { ENQUIRY_TYPES } from '../collections/Enquiries'
import { AdminPage } from './AdminPage'
import { CallForm } from './CallForm'

/** "+ Enquiry from a call" on Today: a short form instead of the full enquiry screen. */
export function AddCallView(view: AdminViewServerProps) {
  return (
    <AdminPage view={view} path="/add-call" title="Enquiry from a call" roles={['owner', 'staff']} intro="Someone phoned? Note it here so it sits with your other enquiries. You can add more on the next screen.">
      <CallForm types={ENQUIRY_TYPES} />
    </AdminPage>
  )
}
