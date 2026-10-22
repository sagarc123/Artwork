import type { GlobalConfig } from 'payload'
import { refreshGlobalOnChange } from '../hooks'
import { anyone, isOwner } from '../access'

/** Business details shown in the footer, policies and invoices (E-Commerce Rules 2020). */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  hooks: refreshGlobalOnChange('site-settings'),
  admin: { group: 'Settings' },
  access: { read: anyone, update: isOwner },
  fields: [
    { name: 'brandName', type: 'text' },
    { name: 'tagline', type: 'text', localized: true },
    {
      name: 'business',
      type: 'group',
      fields: [
        { name: 'legalName', type: 'text' },
        { name: 'gstin', label: 'GSTIN', type: 'text', admin: { description: 'Leave empty until GST registration is done.' } },
        { name: 'address', type: 'textarea' },
        { name: 'city', type: 'text' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'whatsapp', type: 'text', admin: { description: 'With country code, digits only, e.g. 919800000000' } },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'replyHours', label: 'Reply promise (hours)', type: 'number', defaultValue: 4, min: 1 },
      ],
    },
    {
      name: 'grievanceOfficer',
      type: 'group',
      admin: { description: 'Required by the E-Commerce Rules: who customers can complain to.' },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
        { name: 'facebook', type: 'text' },
      ],
    },
  ],
}
