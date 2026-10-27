import type { GlobalConfig, TextFieldSingleValidation } from 'payload'
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
        { name: 'replyHours', label: 'Reply promise (hours)', type: 'number', defaultValue: 4, min: 1, admin: { description: 'Shown on the website ("I reply within 4 hours"). Today warns you when an enquiry has waited longer than this.' } },
      ],
    },
    {
      name: 'announcement',
      label: 'Announcement strip',
      type: 'group',
      admin: { description: 'One short line at the very top of every page, e.g. "Diwali parcels: order by 1 Nov". Visitors can close it.' },
      fields: [
        { name: 'enabled', label: 'Show the strip', type: 'checkbox' },
        {
          name: 'message',
          label: 'Message',
          type: 'text',
          localized: true,
          maxLength: 90,
          admin: { condition: (_, s) => Boolean(s?.enabled), description: 'Write it in each language (switch language at the top). An empty Marathi or Hindi line shows the English one.' },
          validate: ((value, { siblingData, req }) =>
            !(siblingData as { enabled?: boolean })?.enabled || (req.locale && req.locale !== 'en') || (typeof value === 'string' && value.trim()) ? true : 'Write the message, or untick "Show the strip".') as TextFieldSingleValidation,
        },
        {
          name: 'link',
          label: 'Opens this page when tapped (optional)',
          type: 'text',
          admin: { condition: (_, s) => Boolean(s?.enabled), description: 'A page of this website, e.g. /festivals/diwali, or a full https:// link.' },
          validate: ((value) => (!value || /^\/(?!\/)\S*$|^https:\/\/\S+$/.test(value) ? true : 'Start with / for a page of this website, or https:// for another site.')) as TextFieldSingleValidation,
        },
        {
          name: 'festiveLook',
          label: 'Festive look',
          type: 'select',
          defaultValue: 'auto',
          admin: { isClearable: false, description: 'A small festival decoration under the menu. Automatic: for 3 weeks before each festival that has a date.' },
          options: [
            { label: 'Off', value: 'off' },
            { label: 'Automatic', value: 'auto' },
            { label: 'Diwali (toran and diyas)', value: 'diwali' },
            { label: 'Ganesh festival (modak and durva)', value: 'ganesh' },
            { label: 'Gudi Padwa', value: 'gudi' },
            { label: 'Wedding season', value: 'wedding' },
          ],
        },
      ],
    },
    {
      name: 'instagram',
      label: 'Instagram on the home page',
      type: 'group',
      admin: { description: 'Pick 3 to 6 photos you have posted on Instagram. They show on the home page and open your Instagram.' },
      fields: [
        { name: 'profileUrl', label: 'Your Instagram link', type: 'text', admin: { description: 'e.g. https://instagram.com/yourname. Empty: the Instagram link under Social media links.' } },
        { name: 'posts', label: 'Photos', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 6, admin: { description: 'Choose 3 to 6. With fewer than 3 the strip stays hidden.' } },
        { name: 'caption', label: 'Line under the heading (optional)', type: 'text', localized: true, maxLength: 120 },
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
