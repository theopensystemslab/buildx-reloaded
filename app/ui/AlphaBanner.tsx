import { Close } from "@carbon/icons-react"
import { useState } from "react"

const AlphaBanner = () => {
  const [open, setOpen] = useState(true)

  return open ? (
    <div className="flex justify-between py-1.5 px-2 text-sm w-full bg-safety">
      <div>
        <span className="font-bold">ALPHA</span>
        <span className="ml-2">This is a prototype.</span>
        <span>
          {`You can help us improve by giving `}
          <a
            className="underline"
            href="https://form.typeform.com/to/inbsKUl2"
            target="_blank"
            rel="noopener noreferrer"
          >
            feedback and suggestions.
          </a>
        </span>
      </div>
      <div>
        <span>
          <button onClick={() => void setOpen(false)}>
            <Close size={"16"} />
          </button>
        </span>
      </div>
    </div>
  ) : null
}

export default AlphaBanner
