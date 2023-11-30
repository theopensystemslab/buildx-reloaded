import React from "react"

const AlphaBanner: React.FC = () => {
  return (
    <div className="py-1.5 px-2 text-sm w-full bg-safety">
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
  )
}

export default AlphaBanner
