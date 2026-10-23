/* Payload admin root layout (standard Payload file) plus the site's fonts. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { Mukta, Tiro_Devanagari_Marathi } from 'next/font/google'
import type { ReactNode } from 'react'
import { importMap } from './admin/importMap.js'
import './custom.css'

// Same files as the public site (already cached by the artist's phone). Payload renders <html> itself, so the
// font names are handed to custom.css as variables.
const mukta = Mukta({ weight: ['400', '600', '700'], subsets: ['devanagari', 'latin'], display: 'swap' })
const tiro = Tiro_Devanagari_Marathi({ weight: '400', subsets: ['devanagari', 'latin'], display: 'swap', preload: false })

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <style>{`:root{--admin-font:${mukta.style.fontFamily};--admin-heading:${tiro.style.fontFamily}}`}</style>
      {children}
    </RootLayout>
  )
}
