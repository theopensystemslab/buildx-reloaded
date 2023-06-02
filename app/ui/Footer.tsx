"use client"
import { ArrowDown, ArrowUp } from "@carbon/icons-react"
import Link from "next/link"
import { Fragment, useState } from "react"
import ExternalTextLink from "./ExternalTextLink"
import css from "./Footer.module.css"
import IconButton from "./IconButton"

const mainLinks = [
  { href: "#", label: "Feedback" },
  { href: "#", label: "Terms of use" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Cookies" },
  { href: "#", label: "Accessibility" },
]

const FooterBar = ({ expanded }: { expanded: boolean }) => {
  return (
    <div className={css.bar} data-expanded={expanded}>
      <div className={css.left}>
        {[
          {
            label: "About",
            href: "#",
          },
          {
            label: "Feedback",
            href: "#",
          },
        ].map((link) => (
          <div key={link.href} className={css.linkWrapper}>
            <Link href={link.href}>{link.label}</Link>
          </div>
        ))}
      </div>
      <div className={css.right}>
        <Link href={`#`}>{`©️ Open Systems Lab`}</Link>
      </div>
    </div>
  )
}

const FooterContent = () => {
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
        {mainLinks.map((link) => (
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

const Footer = () => {
  const [expanded, setExpanded] = useState(false)

  const size = "24"

  return (
    <Fragment>
      <div className={css.root} data-expanded={expanded}>
        <FooterBar expanded={expanded} />
        <FooterContent />
      </div>
      <div className="absolute left-2 z-50 bottom-0 text-white">
        <IconButton
          onClick={() => {
            setExpanded((prev) => !prev)
          }}
        >
          {expanded ? <ArrowDown size={size} /> : <ArrowUp size={size} />}
        </IconButton>
      </div>
    </Fragment>
  )
}

export default Footer
