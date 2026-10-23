import type { GlobalConfig } from 'payload'
import { refreshGlobalOnChange } from '../hooks'
import { anyone, hideFromHelpers, isOwner } from '../access'

/** Business details shown in the footer, policies and invoices (E-Commerce Rules 2020). */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  hooks: refreshGlobalOnChange('site-settings'),
  label: 'Website details',
  admin: { group: 'Settings', hidden: hideFromHelpers, description: 'Your name, contact numbers and business details, shown in the footer, policies and invoices.' },
  access: { read: anyone, update: isOwner },
  fields: [
    { name: 'brandName', label: 'Name on the website', type: 'text', admin: { description: 'Leave empty to use "Siddesh Mokashi".' } },
    { name: 'tagline', label: 'Tagline', type: 'text', localized: true, admin: { description: 'One short line under your name.' } },
    {
      name: 'business',
      label: 'Business (for invoices)',
      type: 'group',
      fields: [
        { name: 'legalName', label: 'Legal name', type: 'text', admin: { description: 'As on your PAN or GST certificate.' } },
        { name: 'gstin', label: 'GSTIN', type: 'text', admin: { description: 'Leave empty until GST registration is done.' } },
        { name: 'address', label: 'Address', type: 'textarea' },
        { name: 'city', label: 'City', type: 'text' },
      ],
    },
    {
      name: 'contact',
      label: 'How customers reach you',
      type: 'group',
      fields: [
        { name: 'whatsapp', label: 'WhatsApp number', type: 'text', admin: { description: 'With country code, digits only, e.g. 919800000000' } },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'replyHours', label: 'Reply promise (hours)', type: 'number', defaultValue: 4, min: 1, admin: { description: 'Today warns you when an enquiry has waited longer than this.' } },
      ],
    },
    {
      name: 'grievanceOfficer',
      label: 'Complaints contact',
      type: 'group',
      admin: { description: 'Required by the E-Commerce Rules: who customers can complain to.' },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'social',
      label: 'Social media links',
      type: 'group',
      admin: { description: 'Full links, e.g. https://instagram.com/yourname' },
      fields: [
        { name: 'instagram', label: 'Instagram', type: 'text' },
        { name: 'youtube', label: 'YouTube', type: 'text' },
        { name: 'facebook', label: 'Facebook', type: 'text' },
      ],
    },
  ],
}
