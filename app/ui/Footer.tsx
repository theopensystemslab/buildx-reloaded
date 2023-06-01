import Link from "next/link"
import { memo } from "react"
import ExternalTextLink from "./ExternalTextLink"
// import ExternalTextLink from "./ExternalTextLink"
import css from "./Footer.module.css"

const links = [
  { href: "#", label: "Terms of use" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Cookies" },
  { href: "#", label: "Accessibility" },
]

const Footer = () => {
  return (
    <footer className={`${css.footer} `}>
      <div className={`${css.column} ${css.column1}`}>
        <p className={`${css.text} `}>
          <strong>Disclaimer</strong> All designs and data provided are
          estimated. Use for guidance only. You are responsible for checking
          that anything you build is safe, fit for purpose and meets all
          relevant legislation.
        </p>
      </div>
      <div className={`${css.column} ${css.column2}`}>
        {links.map((link) => (
          <div key={link.href} className={css.linkWrapper}>
            <Link href={link.href}>{link.label}</Link>
          </div>
        ))}
      </div>
      <div className={`${css.column} ${css.column3}`}>
        <p className={`${css.text} text-sm`}>
          Build✕ is being developed by Open Systems Lab, non-profit company
          9152368 registered in England & Wales
        </p>
        <div className="mt-4">
          <ExternalTextLink
            href="https://opensystemslab.io"
            label="Go to website"
          />
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
