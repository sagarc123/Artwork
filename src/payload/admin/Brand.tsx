import { BrandMark } from '../../components/Art'

/** Login page: the site's Bindu mark with the artist's name in English and Marathi. */
export function Logo() {
  return (
    <div className="brand-logo">
      <BrandMark className="brand-logo__mark" />
      <div>
        <p className="brand-logo__name">Siddesh Mokashi</p>
        <p className="brand-logo__mr" lang="mr">
          सिद्धेश मोकाशी
        </p>
      </div>
    </div>
  )
}

/** Small mark in the top bar and menu: drawn once on the login page, not on every admin page. */
export function Icon() {
  return <BrandMark className="brand-icon" animate={false} />
}
