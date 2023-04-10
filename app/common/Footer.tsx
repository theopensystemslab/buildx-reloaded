import Link from "next/link"
import React, { memo } from "react"
import ExternalTextLink from "./ExternalTextLink"
import styles from "./Footer.module.css"

const links = [
  { href: "/terms-of-use", label: "Terms of use" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/accessibility", label: "Accessibility" },
]

const Footer = () => {
  return (
    <footer className={`${styles.footer} `}>
      <div className={`${styles.column} ${styles.column1}`}>
        <p className={`${styles.text} `}>
          <strong>Disclaimer</strong> All designs and data provided are
          estimated. Use for guidance only. You are responsible for checking
          that anything you build is safe, fit for purpose and meets all
          relevant legislation.
        </p>
      </div>
      <div className={`${styles.column} ${styles.column2}`}>
        {links.map((link) => (
          <div key={link.href} className={styles.linkWrapper}>
            <Link href={link.href}>{link.label}</Link>
          </div>
        ))}
      </div>
      <div className={`${styles.column} ${styles.column3}`}>
        <p className={`${styles.text} text-sm`}>
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
